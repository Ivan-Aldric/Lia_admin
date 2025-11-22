import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Stricter rate limiting for authentication endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Validation middleware with stronger password requirements
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
]

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
]

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validateRegister, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      })
    }

    const { email, password, firstName, lastName } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    })

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res, next) => {
  // Log failed login attempts for security monitoring
  const logFailedAttempt = (email, reason) => {
    console.warn('Security Event:', {
      type: 'failed_login',
      email,
      reason,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    })
  }
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      logFailedAttempt(email, 'user_not_found')
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      logFailedAttempt(email, 'invalid_password')
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      })
    }

    // Generate token
    const token = generateToken(user.id)

    // Return user data (excluding password)
    const { password: _, ...userData } = user

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { firstName, lastName, avatar } = req.body

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, validatePasswordChange, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      })
    }

    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedNewPassword },
    })

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router
