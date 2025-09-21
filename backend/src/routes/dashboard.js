import express from 'express'
import { prisma } from '../server.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// AI-powered account summary endpoint
router.get('/ai-summary', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch all data in parallel
    const [
      tasks,
      appointments,
      transactions,
      notifications,
      recentTasks,
      recentAppointments,
      recentTransactions
    ] = await Promise.all([
      // Task statistics
      prisma.task.findMany({
        where: { userId },
        select: { status: true, dueDate: true, createdAt: true }
      }),
      
      // Appointment statistics
      prisma.appointment.findMany({
        where: { userId },
        select: { status: true, startTime: true, createdAt: true }
      }),
      
      // Financial data for current month
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { type: true, amount: true, date: true }
      }),
      
      // Unread notifications
      prisma.notification.count({
        where: { userId, isRead: false }
      }),
      
      // Recent tasks (last 7 days)
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, status: true, createdAt: true }
      }),
      
      // Recent appointments (last 7 days)
      prisma.appointment.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, status: true, createdAt: true }
      }),
      
      // Recent transactions (last 7 days)
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { date: 'desc' },
        take: 5,
        select: { description: true, type: true, amount: true, date: true }
      })
    ])

    // Calculate task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
    const overdueTasks = tasks.filter(t => 
      t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now
    ).length

    // Calculate appointment statistics
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
    const upcomingAppointments = appointments.filter(a => 
      a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
    ).length

    // Calculate financial statistics
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    
    const netSavings = totalIncome - totalExpenses

    // Generate AI insights
    const insights = generateAIInsights({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      totalIncome,
      totalExpenses,
      netSavings,
      unreadNotifications: notifications
    })

    // Format recent activity
    const recentActivity = [
      ...recentTasks.map(task => ({
        type: 'task',
        title: task.title,
        date: task.createdAt,
        status: task.status
      })),
      ...recentAppointments.map(appointment => ({
        type: 'appointment',
        title: appointment.title,
        date: appointment.createdAt,
        status: appointment.status
      })),
      ...recentTransactions.map(transaction => ({
        type: 'transaction',
        title: transaction.description,
        date: transaction.date,
        status: transaction.type
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    const summary = {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      totalIncome,
      totalExpenses,
      netSavings,
      unreadNotifications: notifications,
      recentActivity,
      insights
    }

    res.json({
      success: true,
      data: summary
    })

  } catch (error) {
    console.error('AI Summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate account summary',
      details: error.message
    })
  }
})

// AI insights generation function
function generateAIInsights(data) {
  const insights = []

  // Task completion insights
  if (data.totalTasks > 0) {
    const completionRate = (data.completedTasks / data.totalTasks) * 100
    if (completionRate >= 80) {
      insights.push("Excellent task completion rate! You're staying on top of your goals.")
    } else if (completionRate >= 60) {
      insights.push("Good progress on tasks. Consider prioritizing overdue items.")
    } else {
      insights.push("Focus on completing pending tasks to improve productivity.")
    }
  }

  // Overdue task insights
  if (data.overdueTasks > 0) {
    insights.push(`${data.overdueTasks} task(s) are overdue. Consider rescheduling or breaking them into smaller steps.`)
  }

  // Financial insights
  if (data.netSavings > 0) {
    insights.push("Great job! You're saving money this month. Keep up the good financial habits.")
  } else if (data.netSavings < 0) {
    insights.push("You're spending more than you're earning. Consider reviewing your expenses.")
  }

  // Appointment insights
  if (data.upcomingAppointments > 0) {
    insights.push(`You have ${data.upcomingAppointments} upcoming appointment(s). Make sure to prepare accordingly.`)
  }

  // Notification insights
  if (data.unreadNotifications > 5) {
    insights.push("You have several unread notifications. Consider reviewing them to stay updated.")
  }

  // Productivity insights
  if (data.completedTasks > 0 && data.completedAppointments > 0) {
    insights.push("You're maintaining a good balance between tasks and appointments.")
  }

  // Time management insights
  const totalActivities = data.totalTasks + data.totalAppointments
  if (totalActivities > 20) {
    insights.push("You have a lot on your plate. Consider using time-blocking techniques.")
  } else if (totalActivities < 5) {
    insights.push("You have a light schedule. This might be a good time to plan new goals.")
  }

  return insights.slice(0, 5) // Limit to 5 insights
}

// AI Chat endpoint
router.post('/ai-chat', authMiddleware, async (req, res, next) => {
  try {
    const { message, context } = req.body
    const userId = req.userId

    console.log('AI Chat request:', { message, userId, hasContext: !!context })

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      })
    }

    // Get fresh data for context
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [tasks, appointments, transactions, recentTasks, recentAppointments] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        select: { id: true, title: true, status: true, dueDate: true, createdAt: true, priority: true }
      }),
      prisma.appointment.findMany({
        where: { userId },
        select: { id: true, title: true, status: true, startTime: true, endTime: true, createdAt: true }
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { id: true, description: true, type: true, amount: true, date: true, category: true }
      }),
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { title: true, status: true, createdAt: true, priority: true }
      }),
      prisma.appointment.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { title: true, status: true, createdAt: true }
      })
    ])

    // Generate AI response based on message and data
    const response = await generateAIResponse(message, {
      tasks,
      appointments,
      transactions,
      recentTasks,
      recentAppointments,
      context: context || {}
    })

    console.log('AI Response generated:', { message: response.message, hasData: !!response.data })

    res.json({
      success: true,
      response: response.message,
      data: response.data
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
      details: error.message
    })
  }
})

// AI Response Generation
async function generateAIResponse(userMessage, data) {
  const message = userMessage.toLowerCase().trim()
  
  console.log('Processing message:', message)
  
  // Handle empty or very short messages
  if (message.length < 2) {
    return {
      message: "Please ask me a specific question about your tasks, appointments, finances, or productivity. I'm here to help!",
      data: null
    }
  }
  
  // Task-related queries
  if (message.includes('task') || message.includes('todo') || message.includes('work') || message.includes('complete') || message.includes('pending') || message.includes('overdue')) {
    return handleTaskQuery(message, data)
  }
  
  // Appointment-related queries
  if (message.includes('appointment') || message.includes('meeting') || message.includes('schedule') || message.includes('calendar') || message.includes('upcoming')) {
    return handleAppointmentQuery(message, data)
  }
  
  // Financial queries
  if (message.includes('money') || message.includes('expense') || message.includes('income') || message.includes('budget') || message.includes('financial') || message.includes('spending') || message.includes('saving')) {
    return handleFinancialQuery(message, data)
  }
  
  // Productivity queries
  if (message.includes('productivity') || message.includes('progress') || message.includes('performance') || message.includes('how am i doing') || message.includes('score') || message.includes('rate')) {
    return handleProductivityQuery(message, data)
  }
  
  // General greeting or help
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('help') || message.includes('what can you do') || message.includes('ok') || message.includes('thanks')) {
    return handleGeneralQuery(message, data)
  }
  
  // Numbers and statistics
  if (message.includes('how many') || message.includes('count') || message.includes('total') || message.includes('statistics') || message.includes('stats')) {
    return handleStatisticsQuery(message, data)
  }
  
  // Default response with more helpful suggestions
  return {
    message: "I can help you analyze your data! Try asking me:\n\n• \"How many tasks do I have?\"\n• \"Show me my recent tasks\"\n• \"What are my upcoming appointments?\"\n• \"How am I doing financially?\"\n• \"What's my productivity score?\"\n\nWhat would you like to know?",
    data: null
  }
}

function handleTaskQuery(message, data) {
  const { tasks, recentTasks } = data
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
  const overdueTasks = tasks.filter(t => 
    t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length
  
  if (message.includes('how many') || message.includes('count') || message.includes('total')) {
    return {
      message: `You have ${totalTasks} total tasks: ${completedTasks} completed, ${pendingTasks} pending, and ${overdueTasks} overdue. Your completion rate is ${Math.round((completedTasks / totalTasks) * 100)}%.`,
      data: { totalTasks, completedTasks, pendingTasks, overdueTasks }
    }
  }
  
  if (message.includes('recent') || message.includes('latest')) {
    const recent = recentTasks.slice(0, 5)
    const taskList = recent.map(t => `• ${t.title} (${t.status})`).join('\n')
    return {
      message: `Here are your recent tasks:\n\n${taskList}`,
      data: { recentTasks: recent }
    }
  }
  
  if (message.includes('overdue')) {
    const overdue = tasks.filter(t => 
      t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
    )
    if (overdue.length === 0) {
      return {
        message: "Great news! You don't have any overdue tasks. Keep up the good work!",
        data: { overdueTasks: [] }
      }
    }
    const overdueList = overdue.map(t => `• ${t.title} (due: ${new Date(t.dueDate).toLocaleDateString()})`).join('\n')
    return {
      message: `You have ${overdue.length} overdue tasks:\n\n${overdueList}\n\nI recommend prioritizing these tasks to get back on track.`,
      data: { overdueTasks: overdue }
    }
  }
  
  return {
    message: `You have ${totalTasks} tasks with a ${Math.round((completedTasks / totalTasks) * 100)}% completion rate. ${overdueTasks > 0 ? `You have ${overdueTasks} overdue tasks that need attention.` : 'Great job staying on top of your tasks!'}`,
    data: { totalTasks, completedTasks, pendingTasks, overdueTasks }
  }
}

function handleAppointmentQuery(message, data) {
  const { appointments, recentAppointments } = data
  const totalAppointments = appointments.length
  const upcomingAppointments = appointments.filter(a => 
    a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
  ).length
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
  
  if (message.includes('upcoming') || message.includes('next')) {
    const upcoming = appointments.filter(a => 
      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && new Date(a.startTime) > new Date()
    ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 5)
    
    if (upcoming.length === 0) {
      return {
        message: "You don't have any upcoming appointments scheduled.",
        data: { upcomingAppointments: [] }
      }
    }
    
    const upcomingList = upcoming.map(a => `• ${a.title} (${new Date(a.startTime).toLocaleString()})`).join('\n')
    return {
      message: `Here are your upcoming appointments:\n\n${upcomingList}`,
      data: { upcomingAppointments: upcoming }
    }
  }
  
  return {
    message: `You have ${totalAppointments} total appointments: ${completedAppointments} completed and ${upcomingAppointments} upcoming.`,
    data: { totalAppointments, completedAppointments, upcomingAppointments }
  }
}

function handleFinancialQuery(message, data) {
  const { transactions } = data
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
  
  const netSavings = totalIncome - totalExpenses
  
  if (message.includes('income') || message.includes('earning')) {
    return {
      message: `Your total income this month is $${totalIncome.toLocaleString()}. ${netSavings > 0 ? 'Great job saving money!' : 'Consider reviewing your expenses.'}`,
      data: { totalIncome, netSavings }
    }
  }
  
  if (message.includes('expense') || message.includes('spending')) {
    return {
      message: `Your total expenses this month are $${totalExpenses.toLocaleString()}. ${netSavings > 0 ? 'You\'re spending less than you earn!' : 'You\'re spending more than you earn this month.'}`,
      data: { totalExpenses, netSavings }
    }
  }
  
  return {
    message: `Your financial summary: Income $${totalIncome.toLocaleString()}, Expenses $${totalExpenses.toLocaleString()}, Net Savings $${netSavings.toLocaleString()}. ${netSavings > 0 ? 'You\'re doing great financially!' : 'Consider reviewing your budget.'}`,
    data: { totalIncome, totalExpenses, netSavings }
  }
}

function handleProductivityQuery(message, data) {
  const { tasks, appointments } = data
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  let productivityScore = 0
  let feedback = []
  
  // Task completion analysis
  if (completionRate >= 80) {
    productivityScore += 40
    feedback.push("Excellent task completion rate!")
  } else if (completionRate >= 60) {
    productivityScore += 25
    feedback.push("Good task completion rate, room for improvement.")
  } else {
    feedback.push("Focus on completing more tasks to improve productivity.")
  }
  
  // Overdue tasks analysis
  const overdueTasks = tasks.filter(t => 
    t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length
  
  if (overdueTasks === 0) {
    productivityScore += 30
    feedback.push("No overdue tasks - great time management!")
  } else if (overdueTasks <= 2) {
    productivityScore += 15
    feedback.push("Few overdue tasks, manageable.")
  } else {
    feedback.push("Several overdue tasks need attention.")
  }
  
  // Appointment management
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
  const appointmentRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 100
  
  if (appointmentRate >= 90) {
    productivityScore += 30
    feedback.push("Excellent appointment management!")
  } else if (appointmentRate >= 70) {
    productivityScore += 20
    feedback.push("Good appointment management.")
  }
  
  const score = Math.min(100, productivityScore)
  
  return {
    message: `Your productivity score is ${score}/100. ${feedback.join(' ')} ${score >= 80 ? 'Keep up the excellent work!' : score >= 60 ? 'You\'re doing well, with room for improvement.' : 'Focus on completing tasks and managing your time better.'}`,
    data: { 
      productivityScore: score, 
      taskCompletionRate: completionRate, 
      overdueTasks, 
      appointmentCompletionRate: appointmentRate,
      feedback 
    }
  }
}

function handleStatisticsQuery(message, data) {
  const { tasks, appointments, transactions } = data
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
  
  return {
    message: `Here's your account overview:\n\n📋 **Tasks:** ${totalTasks} total (${completedTasks} completed)\n📅 **Appointments:** ${totalAppointments} total (${completedAppointments} completed)\n💰 **Finances:** $${totalIncome.toLocaleString()} income, $${totalExpenses.toLocaleString()} expenses\n\nWould you like more details about any specific area?`,
    data: { 
      totalTasks, 
      completedTasks, 
      totalAppointments, 
      completedAppointments, 
      totalIncome, 
      totalExpenses 
    }
  }
}

function handleGeneralQuery(message, data) {
  const responses = [
    "Hello! I'm your AI assistant for LIA Admin. I can help you analyze your tasks, appointments, finances, and productivity. What would you like to know?",
    "Hi there! I'm here to help you understand your data better. Ask me about your tasks, appointments, or financial status!",
    "Hey! I can provide insights about your productivity, upcoming tasks, financial health, and more. What interests you?",
    "Thanks for reaching out! I'm ready to help you analyze your account data. What would you like to explore?",
    "Great to hear from you! I can help with task management, appointment scheduling, financial tracking, and productivity insights. What can I help you with today?"
  ]
  
  // Return a random response for variety
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return {
    message: randomResponse,
    data: null
  }
}

// Check authentication status
router.get('/auth-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })
    
    res.json({
      success: true,
      authenticated: true,
      user: user
    })
  } catch (error) {
    res.json({
      success: false,
      authenticated: false,
      error: error.message
    })
  }
})

// Check what data exists in the database (no auth required)
router.get('/data-check', async (req, res) => {
  try {
    const [userCount, taskCount, appointmentCount, transactionCount] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.appointment.count(),
      prisma.transaction.count()
    ])
    
    res.json({
      success: true,
      data: {
        users: userCount,
        tasks: taskCount,
        appointments: appointmentCount,
        transactions: transactionCount,
        message: userCount > 0 ? 'Database has data' : 'Database is empty - create an account to see real data'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check data',
      details: error.message
    })
  }
})

// Test endpoint for AI summary (no auth required)
router.get('/test-ai-summary', async (req, res) => {
  try {
    // Mock data for testing
    const mockSummary = {
      totalTasks: 5,
      completedTasks: 3,
      pendingTasks: 2,
      overdueTasks: 1,
      totalAppointments: 3,
      upcomingAppointments: 2,
      completedAppointments: 1,
      totalIncome: 5000,
      totalExpenses: 3200,
      netSavings: 1800,
      unreadNotifications: 2,
      recentActivity: [
        { type: 'task', title: 'Complete project report', date: new Date(), status: 'COMPLETED' },
        { type: 'appointment', title: 'Team meeting', date: new Date(), status: 'SCHEDULED' },
        { type: 'transaction', title: 'Salary payment', date: new Date(), status: 'INCOME' }
      ],
      insights: [
        "📊 Your database contains 7 tasks, 8 appointments, and 14 transactions!",
        "🔐 Log in to see your real data instead of this demo.",
        "💡 The AI can analyze your actual productivity patterns when authenticated."
      ]
    }

    res.json({
      success: true,
      data: mockSummary
    })
  } catch (error) {
    console.error('Test AI Summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate test summary',
      details: error.message
    })
  }
})

// Test endpoint for AI chat
router.post('/test-ai-chat', async (req, res) => {
  try {
    const { message } = req.body
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      })
    }

    // Mock data for testing
    const mockData = {
      tasks: [
        { id: '1', title: 'Test Task 1', status: 'COMPLETED', dueDate: new Date(), createdAt: new Date(), priority: 'HIGH' },
        { id: '2', title: 'Test Task 2', status: 'PENDING', dueDate: new Date(), createdAt: new Date(), priority: 'MEDIUM' }
      ],
      appointments: [
        { id: '1', title: 'Test Appointment', status: 'SCHEDULED', startTime: new Date(), endTime: new Date(), createdAt: new Date() }
      ],
      transactions: [
        { id: '1', description: 'Test Income', type: 'INCOME', amount: 1000, date: new Date(), category: 'SALARY' },
        { id: '2', description: 'Test Expense', type: 'EXPENSE', amount: 200, date: new Date(), category: 'FOOD' }
      ],
      recentTasks: [],
      recentAppointments: [],
      context: {}
    }

    const response = await generateAIResponse(message, mockData)
    
    res.json({
      success: true,
      response: response.message,
      data: response.data
    })
  } catch (error) {
    console.error('Test AI Chat error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process test AI request',
      details: error.message
    })
  }
})

export default router
