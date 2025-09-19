import express from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'
import { appointmentNotificationTriggers } from '../services/notificationTriggers.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation middleware
const validateAppointment = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('location').optional().trim(),
  body('isAllDay').optional().isBoolean(),
]

// @route   GET /api/appointments
// @desc    Get all appointments for the authenticated user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query
    
    // Build where clause
    const where = {
      userId: req.userId,
      ...(status && { status }),
      ...(startDate && endDate && {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        attendees: true,
      },
      orderBy: { startTime: 'asc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    })

    // Get total count for pagination
    const total = await prisma.appointment.count({ where })

    res.json({
      success: true,
      data: appointments,
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

// @route   GET /api/appointments/:id
// @desc    Get a single appointment
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        attendees: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      })
    }

    res.json({
      success: true,
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', validateAppointment, async (req, res, next) => {
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

    const { title, description, startTime, endTime, location, isAllDay, attendees } = req.body

    // Validate time range
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time',
      })
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isAllDay: isAllDay || false,
        userId: req.userId,
        attendees: attendees ? {
          create: attendees.map(attendee => ({
            name: attendee.name,
            email: attendee.email,
            phone: attendee.phone,
          }))
        } : undefined,
      },
      include: {
        attendees: true,
      },
    })

    // Trigger notification for appointment creation
    await appointmentNotificationTriggers.onAppointmentCreated(appointment)

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/appointments/:id
// @desc    Update an appointment
// @access  Private
router.put('/:id', validateAppointment, async (req, res, next) => {
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

    const { title, description, startTime, endTime, location, isAllDay, status } = req.body

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      })
    }

    // Validate time range
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time',
      })
    }

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isAllDay: isAllDay || false,
        status,
      },
      include: {
        attendees: true,
      },
    })

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      })
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router
