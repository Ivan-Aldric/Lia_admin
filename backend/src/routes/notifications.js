import express from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { isRead, type, page = 1, limit = 20 } = req.query
    
    // Build where clause
    const where = {
      userId: req.userId,
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
      ...(type && { type }),
    }

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    })

    // Get total count for pagination
    const total = await prisma.notification.count({ where })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.userId,
        isRead: false,
      },
    })

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', async (req, res, next) => {
  try {
    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      })
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    })

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', async (req, res, next) => {
  try {
    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', async (req, res, next) => {
  try {
    const { emailNotifications, smsNotifications, whatsappNotifications } = req.body

    // Update user settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        whatsappNotifications: whatsappNotifications !== undefined ? whatsappNotifications : false,
      },
      create: {
        userId: req.userId,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        whatsappNotifications: whatsappNotifications !== undefined ? whatsappNotifications : false,
      },
    })

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: settings,
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      })
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/notifications
// @desc    Delete all notifications for the user
// @access  Private
router.delete('/', async (req, res, next) => {
  try {
    // Delete all notifications for the user
    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.userId,
      },
    })

    res.json({
      success: true,
      message: `${result.count} notifications deleted successfully`,
    })
  } catch (error) {
    next(error)
  }
})

export default router
