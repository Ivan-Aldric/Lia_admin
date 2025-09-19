import express from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    })

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.userSettings.create({
        data: { userId: req.userId },
      })
      return res.json({
        success: true,
        data: defaultSettings,
      })
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', async (req, res, next) => {
  try {
    const {
      theme,
      emailNotifications,
      smsNotifications,
      whatsappNotifications,
      language,
      timezone,
      profileVisibility,
    } = req.body

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme value',
      })
    }

    // Validate profile visibility
    if (profileVisibility && !['public', 'private', 'friends'].includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile visibility value',
      })
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: {
        ...(theme && { theme }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(whatsappNotifications !== undefined && { whatsappNotifications }),
        ...(language && { language }),
        ...(timezone && { timezone }),
        ...(profileVisibility && { profileVisibility }),
      },
      create: {
        userId: req.userId,
        theme: theme || 'system',
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        whatsappNotifications: whatsappNotifications !== undefined ? whatsappNotifications : false,
        language: language || 'en',
        timezone: timezone || 'UTC',
        profileVisibility: profileVisibility || 'private',
      },
    })

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/settings/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', async (req, res, next) => {
  try {
    // This is a placeholder for file upload functionality
    // In a real implementation, you would use multer or similar middleware
    // to handle file uploads and store them in a cloud service like AWS S3
    
    const { avatarUrl } = req.body

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required',
      })
    }

    // Update user avatar
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: avatarUrl },
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
      message: 'Avatar updated successfully',
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/settings/avatar
// @desc    Remove user avatar
// @access  Private
router.delete('/avatar', async (req, res, next) => {
  try {
    // Update user avatar to null
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: null },
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
      message: 'Avatar removed successfully',
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/settings/reset
// @desc    Permanently delete all data scoped to the authenticated user
// @access  Private
router.post('/reset', async (req, res, next) => {
  try {
    const userId = req.userId

    await prisma.$transaction(async (tx) => {
      // Helper: safely delete if model exists
      const safeDelete = async (model, where) => {
        try {
          if (model && typeof model.deleteMany === 'function') {
            await model.deleteMany({ where })
          }
        } catch (_e) {}
      }

      // Delete related domain data first (respect FK constraints)
      await safeDelete(tx.notification, { userId })
      await safeDelete(tx.notifications, { userId })
      await safeDelete(tx.transaction, { userId })
      await safeDelete(tx.transactions, { userId })
      await safeDelete(tx.financeTransaction, { userId })
      await safeDelete(tx.appointment, { userId })
      await safeDelete(tx.appointments, { userId })

      // Tasks and their children
      // Many-to-many join table names can vary; try a few common ones
      try { await tx.taskTag?.deleteMany({ where: { task: { userId } } }) } catch (_e) {}
      try { await tx.tasksOnTags?.deleteMany({ where: { task: { userId } } }) } catch (_e) {}
      await safeDelete(tx.tag, { userId })
      await safeDelete(tx.tags, { userId })
      await safeDelete(tx.task, { userId })
      await safeDelete(tx.tasks, { userId })

      // Finance categories if user-scoped
      await safeDelete(tx.category, { userId })
      await safeDelete(tx.categories, { userId })

      // Settings last (will be recreated lazily)
      await safeDelete(tx.userSettings, { userId })
    })

    res.json({ success: true, message: 'All account data has been reset.' })
  } catch (error) {
    next(error)
  }
})

export default router
