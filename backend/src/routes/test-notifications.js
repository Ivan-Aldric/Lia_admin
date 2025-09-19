import express from 'express'
import { prisma } from '../server.js'
import { sendEmailNotification } from '../services/notificationService.js'
import { updateTasksToInProgress, checkDayBeforeReminders, checkDueTodayReminders, updateOverdueTasksToCompleted, updateAppointmentsToConfirmed, updateAppointmentsToCompleted } from '../services/notificationTriggers.js'

const router = express.Router()

// Test route to send a sample email notification
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      })
    }

    // Create a test notification
    const testNotification = {
      id: 'test-' + Date.now(),
      title: 'Test Email Notification',
      message: 'This is a test email from LIA Admin to verify that email notifications are working correctly!',
      type: 'GENERAL',
      createdAt: new Date(),
    }

    // Send the test email
    const result = await sendEmailNotification(email, testNotification, process.env.EMAIL_LOGO_URL)

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      })
    }
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to send professional email with logo
router.post('/test-professional-email', async (req, res) => {
  try {
    const { email, logoUrl = process.env.EMAIL_LOGO_URL } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      })
    }

    // Create a professional test notification
    const testNotification = {
      id: 'test-professional-' + Date.now(),
      title: 'Task Status Update',
      message: 'Your task "Complete Project Documentation" has been automatically moved to "In Progress" status as it is due today (12/18/2024). Please ensure timely completion.',
      type: 'TASK_REMINDER',
      createdAt: new Date(),
    }

    // Send the professional test email
    const result = await sendEmailNotification(email, testNotification, logoUrl)

    if (result.success) {
      res.json({
        success: true,
        message: 'Professional test email sent successfully!',
        messageId: result.messageId,
        logoUrl: logoUrl || 'Using default emoji logo'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: result.error
      })
    }
  } catch (error) {
    console.error('Professional test email error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to create a task and trigger notification
router.post('/test-task-notification', async (req, res) => {
  try {
    const { userId, email } = req.body
    
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required'
      })
    }

    // Create a test task
    const testTask = await prisma.task.create({
      data: {
        title: 'Test Task for Email Notification',
        description: 'This is a test task to verify email notifications work when tasks are created.',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        userId: userId,
      },
    })

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: 'New Task Created',
        message: `Task "${testTask.title}" has been created and is due tomorrow.`,
        type: 'GENERAL',
        userId: userId,
      },
    })

    // Send email notification
    const result = await sendEmailNotification(email, notification)

    res.json({
      success: true,
      message: 'Test task created and email notification sent!',
      task: testTask,
      notification: notification,
      emailResult: result
    })
  } catch (error) {
    console.error('Test task notification error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to manually trigger task status updates
router.post('/test-task-status-update', async (req, res) => {
  try {
    console.log('🧪 Manual task status update test triggered...')
    
    // Run the task status update function
    const result = await updateTasksToInProgress()
    
    res.json({
      success: true,
      message: 'Task status update test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test task status update error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to list all tasks for debugging
router.get('/test-list-all-tasks', async (req, res) => {
  try {
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      message: `Found ${allTasks.length} tasks in database`,
      tasks: allTasks
    })
  } catch (error) {
    console.error('Test list all tasks error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to create a task and trigger email notification
router.post('/test-task-email', async (req, res) => {
  try {
    const { userId, title, description, dueDate } = req.body
    
    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        error: 'userId and title are required'
      })
    }

    // Create a test task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || 'Test task for email notification',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: userId,
      },
    })

    // Import and trigger the notification
    const { taskNotificationTriggers } = await import('../services/notificationTriggers.js')
    await taskNotificationTriggers.onTaskCreated(task)

    res.json({
      success: true,
      message: 'Task created and email notification triggered!',
      data: task
    })
  } catch (error) {
    console.error('Test task email error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to create an appointment and trigger email notification
router.post('/test-appointment-email', async (req, res) => {
  try {
    const { userId, title, description, startTime, endTime, location } = req.body
    
    if (!userId || !title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, startTime, and endTime are required'
      })
    }

    // Create a test appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description: description || 'Test appointment for email notification',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || 'Test Location',
        isAllDay: false,
        userId: userId,
      },
    })

    // Import and trigger the notification
    const { appointmentNotificationTriggers } = await import('../services/notificationTriggers.js')
    await appointmentNotificationTriggers.onAppointmentCreated(appointment)

    res.json({
      success: true,
      message: 'Appointment created and email notification triggered!',
      data: appointment
    })
  } catch (error) {
    console.error('Test appointment email error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to get a user for testing
router.get('/test-get-user', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      include: {
        settings: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No users found in database'
      })
    }

    res.json({
      success: true,
      message: 'User found for testing',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailNotifications: user.settings?.emailNotifications ?? true
      }
    })
  } catch (error) {
    console.error('Test get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to trigger day-before reminders (7 AM and 8 PM)
router.post('/test-day-before-reminders', async (req, res) => {
  try {
    console.log('🧪 Manual day-before reminders test triggered...')
    const result = await checkDayBeforeReminders()
    res.json({
      success: true,
      message: 'Day-before reminders test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test day-before reminders error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to trigger due-today reminders (6 AM)
router.post('/test-due-today-reminders', async (req, res) => {
  try {
    console.log('🧪 Manual due-today reminders test triggered...')
    const result = await checkDueTodayReminders()
    res.json({
      success: true,
      message: 'Due-today reminders test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test due-today reminders error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to send actual reminder emails (bypasses time checks)
router.post('/test-send-reminders', async (req, res) => {
  try {
    console.log('🧪 Send reminders test triggered...')
    
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    // Import notification functions
    const { createAndSendNotification } = await import('../services/notificationTriggers.js')

    // Check tasks due today and send reminders
    const tasksDueToday = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: endOfToday,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    // Check tasks due tomorrow and send reminders
    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    // Send due-today reminders
    let dueTodayCount = 0
    for (const task of tasksDueToday) {
      await createAndSendNotification(
        task.userId,
        'TASK_REMINDER',
        'Task Due Today',
        `Final Reminder: Your task "${task.title}" is due today (${new Date(task.dueDate).toLocaleDateString()}). Please complete it as soon as possible to meet your deadline.`,
        { 
          taskId: task.id, 
          taskTitle: task.title,
          dueDate: task.dueDate,
          reminderType: 'due_today'
        }
      )
      dueTodayCount++
    }

    // Send day-before reminders
    let dayBeforeCount = 0
    for (const task of tasksDueTomorrow) {
      await createAndSendNotification(
        task.userId,
        'TASK_REMINDER',
        'Task Due Tomorrow',
        `Reminder: Your task "${task.title}" is due tomorrow (${new Date(task.dueDate).toLocaleDateString()}). Please ensure you're prepared to complete it on time.`,
        { 
          taskId: task.id, 
          taskTitle: task.title,
          dueDate: task.dueDate,
          reminderType: 'day_before'
        }
      )
      dayBeforeCount++
    }

    res.json({
      success: true,
      message: 'Reminder emails sent successfully!',
      timestamp: new Date().toISOString(),
      data: {
        dueTodayRemindersSent: dueTodayCount,
        dayBeforeRemindersSent: dayBeforeCount,
        totalRemindersSent: dueTodayCount + dayBeforeCount
      }
    })
  } catch (error) {
    console.error('Test send reminders error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to force reminders (bypasses time checks)
router.post('/test-force-reminders', async (req, res) => {
  try {
    console.log('🧪 Force reminders test triggered...')
    
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    // Check tasks due today
    const tasksDueToday = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: endOfToday,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    // Check tasks due tomorrow
    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    // Check appointments due today
    const appointmentsDueToday = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: today,
          lte: endOfToday,
        },
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    // Check appointments due tomorrow
    const appointmentsDueTomorrow = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
      },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      },
    })

    res.json({
      success: true,
      message: 'Force reminders test completed successfully!',
      timestamp: new Date().toISOString(),
      data: {
        tasksDueToday: tasksDueToday.length,
        tasksDueTomorrow: tasksDueTomorrow.length,
        appointmentsDueToday: appointmentsDueToday.length,
        appointmentsDueTomorrow: appointmentsDueTomorrow.length,
        currentTime: now.toISOString(),
        todayRange: { start: today.toISOString(), end: endOfToday.toISOString() },
        tomorrowRange: { start: tomorrow.toISOString(), end: endOfTomorrow.toISOString() }
      }
    })
  } catch (error) {
    console.error('Test force reminders error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to update task to IN_PROGRESS for testing
router.post('/test-update-task-to-progress', async (req, res) => {
  try {
    const { taskId } = req.body
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required'
      })
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      },
    })

    res.json({
      success: true,
      message: 'Task updated to IN_PROGRESS successfully!',
      data: updatedTask
    })
  } catch (error) {
    console.error('Test update task to progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to update appointment to CONFIRMED for testing
router.post('/test-update-appointment-to-confirmed', async (req, res) => {
  try {
    const { appointmentId } = req.body
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'appointmentId is required'
      })
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: 'CONFIRMED',
        updatedAt: new Date()
      },
    })

    res.json({
      success: true,
      message: 'Appointment updated to CONFIRMED successfully!',
      data: updatedAppointment
    })
  } catch (error) {
    console.error('Test update appointment to confirmed error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to trigger appointment confirmation
router.post('/test-appointment-confirmation', async (req, res) => {
  try {
    console.log('🧪 Manual appointment confirmation test triggered...')
    const result = await updateAppointmentsToConfirmed()
    res.json({
      success: true,
      message: 'Appointment confirmation test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test appointment confirmation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to trigger appointment completion
router.post('/test-appointment-completion', async (req, res) => {
  try {
    console.log('🧪 Manual appointment completion test triggered...')
    const result = await updateAppointmentsToCompleted()
    res.json({
      success: true,
      message: 'Appointment completion test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test appointment completion error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to create sample financial data
router.post('/test-create-financial-data', async (req, res) => {
  try {
    const userId = "cmfosddlk0000ju4rgq91x23t"
    
    // Create sample transactions for the last 6 months
    const now = new Date()
    const transactions = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      
      // Create income for each month
      const incomeAmount = 50000 + (Math.random() * 10000) // 50k-60k
      transactions.push({
        userId,
        title: `Salary - ${date.toLocaleDateString('en-US', { month: 'long' })}`,
        amount: incomeAmount,
        type: 'INCOME',
        category: 'Salary',
        date: new Date(date.getFullYear(), date.getMonth(), 15) // 15th of each month
      })
      
      // Create expenses for each month
      const expenseAmount = 30000 + (Math.random() * 15000) // 30k-45k
      transactions.push({
        userId,
        title: `Monthly Expenses - ${date.toLocaleDateString('en-US', { month: 'long' })}`,
        amount: expenseAmount,
        type: 'EXPENSE',
        category: 'General',
        date: new Date(date.getFullYear(), date.getMonth(), 20) // 20th of each month
      })
    }
    
    // Insert transactions
    const createdTransactions = await prisma.transaction.createMany({
      data: transactions
    })
    
    res.json({
      success: true,
      message: 'Sample financial data created successfully',
      data: {
        createdCount: createdTransactions.count,
        transactions: transactions
      }
    })
  } catch (error) {
    console.error('Test create financial data error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to check financial data
router.get('/test-financial-data', async (req, res) => {
  try {
    // Get all transactions for the test user
    const transactions = await prisma.transaction.findMany({
      where: { userId: "cmfosddlk0000ju4rgq91x23t" },
      orderBy: { date: 'desc' }
    })

    // Calculate monthly breakdown
    const now = new Date()
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now)
      date.setMonth(date.getMonth() - (5 - i))
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })
      
      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      
      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income: income,
        expenses: expenses,
        savings: income - expenses,
        transactionCount: monthTransactions.length
      }
    })

    res.json({
      success: true,
      message: 'Financial data retrieved successfully',
      data: {
        totalTransactions: transactions.length,
        last6Months: last6Months,
        allTransactions: transactions.map(t => ({
          id: t.id,
          title: t.title,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date
        }))
      }
    })
  } catch (error) {
    console.error('Test financial data error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to trigger overdue task completion
router.post('/test-overdue-completion', async (req, res) => {
  try {
    console.log('🧪 Manual overdue task completion test triggered...')
    const result = await updateOverdueTasksToCompleted()
    res.json({
      success: true,
      message: 'Overdue task completion test completed successfully!',
      timestamp: new Date().toISOString(),
      result: result
    })
  } catch (error) {
    console.error('Test overdue completion error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to get notification count
router.get('/test-notification-count', async (req, res) => {
  try {
    const totalNotifications = await prisma.notification.count()
    const unreadNotifications = await prisma.notification.count({
      where: {
        isRead: false,
      },
    })

    res.json({
      success: true,
      message: `Found ${totalNotifications} total notifications, ${unreadNotifications} unread`,
      data: {
        total: totalNotifications,
        unread: unreadNotifications
      }
    })
  } catch (error) {
    console.error('Test notification count error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to get recent tasks
router.get('/test-recent-tasks', async (req, res) => {
  try {
    const recentTasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        category: true,
        tags: true,
      },
    })

    res.json({
      success: true,
      message: `Found ${recentTasks.length} recent tasks`,
      data: recentTasks
    })
  } catch (error) {
    console.error('Test recent tasks error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Test route to create a task with due date today for testing
router.post('/test-create-due-today-task', async (req, res) => {
  try {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      })
    }

    // Create a test task due today
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const testTask = await prisma.task.create({
      data: {
        title: 'Test Task Due Today',
        description: 'This is a test task with due date set to today for testing automatic status updates.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: today,
        userId: userId,
      },
    })

    res.json({
      success: true,
      message: 'Test task created with due date today!',
      task: testTask,
      note: 'This task should be automatically updated to IN_PROGRESS when the cron job runs.'
    })
  } catch (error) {
    console.error('Test create due today task error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

export default router
