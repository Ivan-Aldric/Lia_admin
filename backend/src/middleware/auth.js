import jwt from 'jsonwebtoken'
import { prisma } from '../server.js'

/**
 * Authentication middleware
 * Verifies JWT token and adds user ID to request object
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied',
      })
    }

    // Extract token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Token is no longer valid',
      })
    }

    // Add user ID to request object
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      })
    }

    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error in authentication',
    })
  }
}
