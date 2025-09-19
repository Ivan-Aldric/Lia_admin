import express from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation middleware
const validateTransaction = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('amount').isDecimal().withMessage('Valid amount is required'),
  body('type').isIn(['INCOME', 'EXPENSE', 'TRANSFER']).withMessage('Valid type is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('date').optional().isISO8601(),
]

// @route   GET /api/finance/transactions
// @desc    Get all transactions for the authenticated user
// @access  Private
router.get('/transactions', async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query
    
    // Build where clause
    const where = {
      userId: req.userId,
      ...(type && { type }),
      ...(category && { category }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    })

    // Get total count for pagination
    const total = await prisma.transaction.count({ where })

    res.json({
      success: true,
      data: transactions,
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

// @route   GET /api/finance/transactions/:id
// @desc    Get a single transaction
// @access  Private
router.get('/transactions/:id', async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      })
    }

    res.json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/finance/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/transactions', validateTransaction, async (req, res, next) => {
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

    const { title, description, amount, type, category, date } = req.body

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: date ? new Date(date) : new Date(),
        userId: req.userId,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
})

// @route   PUT /api/finance/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/transactions/:id', validateTransaction, async (req, res, next) => {
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

    const { title, description, amount, type, category, date } = req.body

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      })
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: date ? new Date(date) : existingTransaction.date,
      },
    })

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
})

// @route   DELETE /api/finance/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/transactions/:id', async (req, res, next) => {
  try {
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    })

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      })
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/finance/categories
// @desc    Get transaction categories
// @access  Private
router.get('/categories', async (req, res, next) => {
  try {
    // Get unique categories from user's transactions
    const categories = await prisma.transaction.findMany({
      where: { userId: req.userId },
      select: { category: true },
      distinct: ['category'],
    })

    const categoryList = categories.map(item => item.category)

    res.json({
      success: true,
      data: categoryList,
    })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/finance/stats
// @desc    Get financial statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query
    
    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get transactions in the period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
    })

    // If no transactions found in the period, get all transactions for the user
    // This handles cases where transactions have future dates or are outside the period
    const allTransactions = transactions.length === 0 ? 
      await prisma.transaction.findMany({
        where: { userId: req.userId },
        orderBy: { date: 'desc' }
      }) : transactions

    // Calculate statistics using allTransactions
    const totalIncome = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    const totalExpenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    const netIncome = totalIncome - totalExpenses

    // Category breakdown
    const categoryBreakdown = allTransactions.reduce((acc, transaction) => {
      const category = transaction.category
      if (!acc[category]) {
        acc[category] = { income: 0, expense: 0 }
      }
      if (transaction.type === 'INCOME') {
        acc[category].income += parseFloat(transaction.amount.toString())
      } else if (transaction.type === 'EXPENSE') {
        acc[category].expense += parseFloat(transaction.amount.toString())
      }
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        period,
        totalIncome,
        totalExpenses,
        netIncome,
        transactionCount: allTransactions.length,
        categoryBreakdown,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
