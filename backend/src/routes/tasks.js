import express from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'
import { taskNotificationTriggers } from '../services/notificationTriggers.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation middleware
const validateTask = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
  body('categoryId').optional().isString(),
]

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query
    
    // Build where clause
    const where = {
      userId: req.userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { categoryId: category }),
    }

    // Get tasks with pagination
    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: true,
        tags: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    })

    // Get total count for pagination
    const total = await prisma.task.count({ where })

    res.json({
      success: true,
      data: tasks,
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

// @route   GET /api/tasks/:id
// @desc    Get a single task
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        category: true,
        tags: true,
      },
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      })
    }

    res.json({
      success: true,
      data: task,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', validateTask, async (req, res, next) => {
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

    const { title, description, priority, dueDate, categoryId, tags } = req.body

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId,
        userId: req.userId,
        tags: tags ? {
          create: tags.map(tag => ({ name: tag.name, color: tag.color || '#6B7280' }))
        } : undefined,
      },
      include: {
        category: true,
        tags: true,
      },
    })

    // Trigger notification for task creation
    await taskNotificationTriggers.onTaskCreated(task)

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', validateTask, async (req, res, next) => {
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

    const { title, description, priority, dueDate, categoryId, status } = req.body

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      })
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId,
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status !== 'COMPLETED' && { completedAt: null }),
      },
      include: {
        category: true,
        tags: true,
      },
    })

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PATCH /api/tasks/:id/complete
// @desc    Mark a task as completed
// @access  Private
router.patch('/:id/complete', async (req, res, next) => {
  try {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      })
    }

    // Update task status
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        category: true,
        tags: true,
      },
    })

    // Trigger notification for task completion
    await taskNotificationTriggers.onTaskCompleted(task)

    res.json({
      success: true,
      message: 'Task completed successfully',
      data: task,
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/tasks/recent
// @desc    Get recent tasks for the authenticated user
// @access  Private
router.get('/recent', async (req, res, next) => {
  try {
    const { limit = 5 } = req.query

    // Get recent tasks ordered by creation date
    const recentTasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      include: {
        category: true,
        tags: true,
      },
    })

    res.json({
      success: true,
      data: recentTasks,
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    // Get task counts by status
    const [total, pending, inProgress, completed] = await Promise.all([
      prisma.task.count({ where: { userId: req.userId } }),
      prisma.task.count({ where: { userId: req.userId, status: 'PENDING' } }),
      prisma.task.count({ where: { userId: req.userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { userId: req.userId, status: 'COMPLETED' } })
    ])

    // Get tasks by priority
    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId: req.userId },
      _count: { priority: true }
    })

    // Get overdue tasks
    const overdue = await prisma.task.count({
      where: {
        userId: req.userId,
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' }
      }
    })

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        priorityStats: priorityStats.reduce((acc, stat) => {
          acc[stat.priority.toLowerCase()] = stat._count.priority
          return acc
        }, {})
      }
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      })
    }

    // Delete task
    await prisma.task.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router
