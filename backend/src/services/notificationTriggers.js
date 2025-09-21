import { prisma } from '../server.js'
import { sendNotification, notificationTemplates } from './notificationService.js'

// Create and send notification
export const createAndSendNotification = async (userId, type, title, message, data = null) => {
  try {
    // Get user and their settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    })

    if (!user) {
      console.error('User not found for notification:', userId)
      return
    }

    // Same-day duplicate suppression (per task/appointment/transaction)
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Identify a resource id if available
    const resourceIdKey = data?.taskId ? 'taskId' : data?.appointmentId ? 'appointmentId' : data?.transactionId ? 'transactionId' : null
    const resourceIdVal = resourceIdKey ? data[resourceIdKey] : null

    const duplicateWhere = {
      userId,
      type,
      createdAt: { gte: startOfDay, lte: endOfDay },
      ...(resourceIdKey && resourceIdVal
        ? (
          data?.reminderType
            ? {
              AND: [
                { data: { contains: `"${resourceIdKey}":"${resourceIdVal}"` } },
                { data: { contains: `"reminderType":"${data.reminderType}"` } }
              ]
            }
            : { data: { contains: `"${resourceIdKey}":"${resourceIdVal}"` } }
        )
        : { title, message }),
    }

    const existing = await prisma.notification.findFirst({ where: duplicateWhere })
    if (existing) {
      console.log('Skipping duplicate notification for same day:', { userId, type, resourceIdKey, resourceIdVal })
      return existing
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        data: data ? JSON.stringify(data) : null,
      },
    })

    // Send notifications based on user preferences
    if (user.settings) {
      const results = await sendNotification(userId, notification, user.settings, user)
      console.log('Notification sent:', { userId, type, results })
    }

    return notification
  } catch (error) {
    console.error('Error creating/sending notification:', error)
  }
}

// Task-related notifications
export const taskNotificationTriggers = {
  // When a task is created
  onTaskCreated: async (task) => {
    await createAndSendNotification(
      task.userId,
      'GENERAL',
      'Task Assignment',
      `A new task "${task.title}" has been assigned to you${task.dueDate ? ` with a deadline of ${new Date(task.dueDate).toLocaleDateString()}` : ''}. Please review and begin work as soon as possible.`,
      { taskId: task.id, taskTitle: task.title, reminderType: 'created' }
    )
  },

  // When a task is due soon (24 hours)
  onTaskDueSoon: async (task) => {
    await createAndSendNotification(
      task.userId,
      'TASK_REMINDER',
      'Upcoming Deadline',
      `Reminder: Your task "${task.title}" is due tomorrow (${new Date(task.dueDate).toLocaleDateString()}). Please ensure completion to meet the deadline.`,
      { taskId: task.id, taskTitle: task.title, dueDate: task.dueDate }
    )
  },

  // When a task is overdue
  onTaskOverdue: async (task) => {
    await createAndSendNotification(
      task.userId,
      'TASK_REMINDER',
      'Overdue Task Alert',
      `URGENT: Your task "${task.title}" is now overdue (was due ${new Date(task.dueDate).toLocaleDateString()}). Please prioritize completion immediately and update the status accordingly.`,
      { taskId: task.id, taskTitle: task.title, dueDate: task.dueDate }
    )
  },

  // When a task is completed
  onTaskCompleted: async (task) => {
    await createAndSendNotification(
      task.userId,
      'GENERAL',
      'Task Completion Confirmed',
      `Excellent work! You have successfully completed the task "${task.title}". Your contribution has been recorded and is greatly appreciated.`,
      { taskId: task.id, taskTitle: task.title }
    )
  },
}

// Appointment-related notifications
export const appointmentNotificationTriggers = {
  // When an appointment is created
  onAppointmentCreated: async (appointment) => {
    await createAndSendNotification(
      appointment.userId,
      'GENERAL',
      'Appointment Confirmed',
      `Your appointment "${appointment.title}" has been successfully scheduled for ${new Date(appointment.startTime).toLocaleString()}${appointment.location ? ` at ${appointment.location}` : ''}. Please arrive on time.`,
      { appointmentId: appointment.id, appointmentTitle: appointment.title }
    )
  },

  // When an appointment is coming up (1 hour before)
  onAppointmentReminder: async (appointment) => {
    await createAndSendNotification(
      appointment.userId,
      'APPOINTMENT_REMINDER',
      'Upcoming Appointment',
      `Reminder: You have an appointment "${appointment.title}" in 1 hour (${new Date(appointment.startTime).toLocaleString()})${appointment.location ? ` at ${appointment.location}` : ''}. Please prepare accordingly.`,
      { appointmentId: appointment.id, appointmentTitle: appointment.title }
    )
  },

  // When an appointment is cancelled
  onAppointmentCancelled: async (appointment) => {
    await createAndSendNotification(
      appointment.userId,
      'GENERAL',
      'Appointment Cancellation',
      `Your appointment "${appointment.title}" scheduled for ${new Date(appointment.startTime).toLocaleString()} has been cancelled. If you need to reschedule, please contact us at your earliest convenience.`,
      { appointmentId: appointment.id, appointmentTitle: appointment.title }
    )
  },
}

// Finance-related notifications
export const financeNotificationTriggers = {
  // When a payment is due
  onPaymentDue: async (transaction) => {
    await createAndSendNotification(
      transaction.userId,
      'PAYMENT_DUE',
      'Payment Reminder',
      `Payment of $${transaction.amount} for "${transaction.title}" is now due. Please process payment to avoid any late fees or service interruptions.`,
      { transactionId: transaction.id, amount: transaction.amount, title: transaction.title }
    )
  },

  // When a large expense is recorded
  onLargeExpense: async (transaction) => {
    if (transaction.type === 'EXPENSE' && transaction.amount > 1000) {
      await createAndSendNotification(
        transaction.userId,
        'GENERAL',
        'High-Value Transaction',
        `A significant expense of $${transaction.amount} for "${transaction.title}" has been recorded in your account. Please review and verify this transaction.`,
        { transactionId: transaction.id, amount: transaction.amount, title: transaction.title }
      )
    }
  },
}

// System notifications
export const systemNotificationTriggers = {
  // Welcome notification for new users
  onUserRegistered: async (user) => {
    await createAndSendNotification(
      user.id,
      'GENERAL',
      'Welcome to LIA Admin!',
      `Welcome to LIA Admin, ${user.firstName}! Start by exploring the dashboard and setting up your first task.`,
      { userId: user.id, userName: user.firstName }
    )
  },

  // System maintenance notifications
  onSystemMaintenance: async (message) => {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: { settings: true },
    })

    for (const user of users) {
      await createAndSendNotification(
        user.id,
        'SYSTEM_UPDATE',
        'System Maintenance',
        message,
        { type: 'maintenance' }
      )
    }
  },
}

// Utility function to check for overdue tasks and send reminders
export const checkOverdueTasks = async () => {
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
      include: { user: { include: { settings: true } } },
    })

    for (const task of overdueTasks) {
      await taskNotificationTriggers.onTaskOverdue(task)
    }

    console.log(`Checked overdue tasks: ${overdueTasks.length} found`)
  } catch (error) {
    console.error('Error checking overdue tasks:', error)
  }
}

// Utility function to check for tasks due soon
export const checkTasksDueSoon = async () => {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const tasksDueSoon = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          gte: tomorrow,
          lt: dayAfter,
        },
      },
      include: { user: { include: { settings: true } } },
    })

    for (const task of tasksDueSoon) {
      await taskNotificationTriggers.onTaskDueSoon(task)
    }

    console.log(`Checked tasks due soon: ${tasksDueSoon.length} found`)
  } catch (error) {
    console.error('Error checking tasks due soon:', error)
  }
}

// Utility function to automatically update task status from PENDING to IN_PROGRESS when due date is reached
export const updateTasksToInProgress = async () => {
  try {
    const now = new Date()
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999) // End of today

    console.log(`🔍 Debug: Current time: ${now.toISOString()}`)
    console.log(`🔍 Debug: End of today: ${endOfToday.toISOString()}`)

    // First, let's see all PENDING tasks
    const allPendingTasks = await prisma.task.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true
      }
    })

    console.log(`🔍 Debug: Found ${allPendingTasks.length} PENDING tasks:`)
    allPendingTasks.forEach(task => {
      console.log(`  - "${task.title}" (ID: ${task.id}) - Due: ${task.dueDate ? task.dueDate.toISOString() : 'No due date'}`)
    })

    // Find tasks that are PENDING and have a due date that is today or in the past
    const tasksToUpdate = await prisma.task.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: endOfToday, // due date is today or earlier
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

    console.log(`Found ${tasksToUpdate.length} tasks to update to IN_PROGRESS`)

    let updatedCount = 0
    let errorCount = 0

    // Update each task to IN_PROGRESS
    for (const task of tasksToUpdate) {
      try {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          },
        })

        // Send notification to user about status change
        await createAndSendNotification(
          task.userId,
          'TASK_REMINDER',
          'Task Status Update',
          `Your task "${task.title}" has been automatically moved to "In Progress" status as it is due today (${new Date(task.dueDate).toLocaleDateString()}). Please ensure timely completion.`,
          {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: 'PENDING',
            newStatus: 'IN_PROGRESS'
          }
        )

        console.log(`✅ Updated task "${task.title}" to IN_PROGRESS`)
        updatedCount++
      } catch (taskError) {
        console.error(`❌ Error updating task "${task.title}":`, taskError)
        errorCount++
      }
    }

    console.log(`Successfully updated ${updatedCount} tasks to IN_PROGRESS (${errorCount} errors)`)
    return { updatedCount, errorCount, totalFound: tasksToUpdate.length }
  } catch (error) {
    console.error('Error updating tasks to IN_PROGRESS:', error)
    throw error
  }
}

// Utility function to check for upcoming appointments
export const checkUpcomingAppointments = async () => {
  try {
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1)

    const twoHoursFromNow = new Date()
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: {
          gte: oneHourFromNow,
          lt: twoHoursFromNow,
        },
      },
      include: { user: { include: { settings: true } } },
    })

    for (const appointment of upcomingAppointments) {
      await appointmentNotificationTriggers.onAppointmentReminder(appointment)
    }

    console.log(`Checked upcoming appointments: ${upcomingAppointments.length} found`)
  } catch (error) {
    console.error('Error checking upcoming appointments:', error)
  }
}

// Check for tasks/appointments due tomorrow (7 AM and 8 PM reminders)
export const checkDayBeforeReminders = async () => {
  try {
    const now = new Date()
    const currentHour = now.getHours()

    // Only run at 7 AM and 8 PM
    if (currentHour !== 7 && currentHour !== 8) {
      return
    }

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0) // Start of tomorrow

    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999) // End of tomorrow

    console.log(`🔔 Checking day-before reminders at ${currentHour}:00...`)

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

    // Send reminders for tasks
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
    }

    // Send reminders for appointments
    for (const appointment of appointmentsDueTomorrow) {
      await createAndSendNotification(
        appointment.userId,
        'APPOINTMENT_REMINDER',
        'Appointment Tomorrow',
        `Reminder: You have an appointment "${appointment.title}" tomorrow at ${new Date(appointment.startTime).toLocaleString()}${appointment.location ? ` at ${appointment.location}` : ''}. Please prepare accordingly.`,
        {
          appointmentId: appointment.id,
          appointmentTitle: appointment.title,
          startTime: appointment.startTime,
          reminderType: 'day_before'
        }
      )
    }

    console.log(`✅ Day-before reminders sent: ${tasksDueTomorrow.length} tasks, ${appointmentsDueTomorrow.length} appointments`)
  } catch (error) {
    console.error('Error checking day-before reminders:', error)
  }
}

// Check for tasks/appointments due today (6 AM reminder)
export const checkDueTodayReminders = async () => {
  try {
    const now = new Date()
    const currentHour = now.getHours()

    // Only run at 6 AM
    if (currentHour !== 6) {
      return
    }

    const today = new Date(now)
    today.setHours(0, 0, 0, 0) // Start of today

    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999) // End of today

    console.log(`🔔 Checking due-today reminders at 6:00 AM...`)

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

    // Send reminders for tasks
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
    }

    // Send reminders for appointments
    for (const appointment of appointmentsDueToday) {
      await createAndSendNotification(
        appointment.userId,
        'APPOINTMENT_REMINDER',
        'Appointment Today',
        `Final Reminder: You have an appointment "${appointment.title}" today at ${new Date(appointment.startTime).toLocaleString()}${appointment.location ? ` at ${appointment.location}` : ''}. Please ensure you're ready and on time.`,
        {
          appointmentId: appointment.id,
          appointmentTitle: appointment.title,
          startTime: appointment.startTime,
          reminderType: 'due_today'
        }
      )
    }

    console.log(`✅ Due-today reminders sent: ${tasksDueToday.length} tasks, ${appointmentsDueToday.length} appointments`)
  } catch (error) {
    console.error('Error checking due-today reminders:', error)
  }
}

// Send a 7-hour follow-up email for tasks created today
export const checkTaskCreationFollowUps = async () => {
  try {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000)
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000)

    // 1-hour window around 7h mark to avoid missing due to cron timing
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: { gte: eightHoursAgo, lte: sevenHoursAgo },
        // ensure it's same day follow-up per requirement
        AND: [{ createdAt: { gte: startOfDay, lte: endOfDay } }],
      },
      include: { user: { include: { settings: true } } },
    })

    let sent = 0
    for (const task of tasks) {
      // Skip if no user or settings
      if (!task.user) continue

      // Prevent duplicate follow-up for this task today
      const exists = await prisma.notification.findFirst({
        where: {
          userId: task.userId,
          type: 'TASK_REMINDER',
          createdAt: { gte: startOfDay, lte: endOfDay },
          AND: [
            { data: { contains: `"taskId":"${task.id}"` } },
            { data: { contains: `"reminderType":"follow_up_7h"` } },
          ],
        },
      })
      if (exists) continue

      await createAndSendNotification(
        task.userId,
        'TASK_REMINDER',
        'Task Follow-up',
        `Just checking in: "${task.title}" was created earlier today. Keep up the momentum!`,
        {
          taskId: task.id,
          taskTitle: task.title,
          reminderType: 'follow_up_7h',
        }
      )
      sent++
    }

    console.log(`✅ Task creation follow-ups sent: ${sent}`)
    return { sent }
  } catch (error) {
    console.error('Error in checkTaskCreationFollowUps:', error)
    return { sent: 0, error: error.message }
  }
}

// Check for overdue tasks and mark them as completed
export const updateOverdueTasksToCompleted = async () => {
  try {
    const now = new Date()
    const endOfYesterday = new Date(now)
    endOfYesterday.setDate(endOfYesterday.getDate() - 1)
    endOfYesterday.setHours(23, 59, 59, 999) // End of yesterday

    console.log(`🔄 Checking for overdue tasks to mark as completed...`)

    // Find tasks that are IN_PROGRESS and have a due date that was yesterday or earlier
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: 'IN_PROGRESS',
        dueDate: {
          lte: endOfYesterday, // due date was yesterday or earlier
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

    console.log(`Found ${overdueTasks.length} overdue tasks to mark as completed`)

    let updatedCount = 0
    let errorCount = 0

    // Update each task to COMPLETED
    for (const task of overdueTasks) {
      try {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date()
          },
        })

        // Send notification to user about automatic completion
        await createAndSendNotification(
          task.userId,
          'TASK_REMINDER',
          'Task Automatically Completed',
          `Your task "${task.title}" has been automatically marked as completed since it was overdue (due date: ${new Date(task.dueDate).toLocaleDateString()}). The task was moved from "In Progress" to "Completed" status.`,
          {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: 'IN_PROGRESS',
            newStatus: 'COMPLETED',
            dueDate: task.dueDate,
            completedAt: new Date()
          }
        )

        console.log(`✅ Marked overdue task "${task.title}" as COMPLETED`)
        updatedCount++
      } catch (taskError) {
        console.error(`❌ Error updating overdue task "${task.title}":`, taskError)
        errorCount++
      }
    }

    console.log(`Successfully marked ${updatedCount} overdue tasks as COMPLETED (${errorCount} errors)`)
    return { updatedCount, errorCount, totalFound: overdueTasks.length }
  } catch (error) {
    console.error('Error updating overdue tasks to COMPLETED:', error)
    throw error
  }
}

// Check for appointments that should start today and mark as CONFIRMED
export const updateAppointmentsToConfirmed = async () => {
  try {
    const now = new Date()
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999) // End of today

    console.log(`🔄 Checking for appointments to mark as CONFIRMED...`)

    // Find appointments that are SCHEDULED and have a start time today or earlier
    const appointmentsToUpdate = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: {
          lte: endOfToday, // start time is today or earlier
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

    console.log(`Found ${appointmentsToUpdate.length} appointments to update to CONFIRMED`)

    let updatedCount = 0
    let errorCount = 0

    // Update each appointment to CONFIRMED
    for (const appointment of appointmentsToUpdate) {
      try {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date()
          },
        })

        // Send notification to user about status change
        await createAndSendNotification(
          appointment.userId,
          'APPOINTMENT_REMINDER',
          'Appointment Status Update',
          `Your appointment "${appointment.title}" has been automatically moved to "Confirmed" status as it is scheduled for today (${new Date(appointment.startTime).toLocaleDateString()}). Please ensure you're prepared and arrive on time.`,
          {
            appointmentId: appointment.id,
            appointmentTitle: appointment.title,
            oldStatus: 'SCHEDULED',
            newStatus: 'CONFIRMED',
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            location: appointment.location
          }
        )

        console.log(`✅ Updated appointment "${appointment.title}" to CONFIRMED`)
        updatedCount++
      } catch (appointmentError) {
        console.error(`❌ Error updating appointment "${appointment.title}":`, appointmentError)
        errorCount++
      }
    }

    console.log(`Successfully updated ${updatedCount} appointments to CONFIRMED (${errorCount} errors)`)
    return { updatedCount, errorCount, totalFound: appointmentsToUpdate.length }
  } catch (error) {
    console.error('Error updating appointments to CONFIRMED:', error)
    throw error
  }
}

// Check for appointments that have ended and mark as COMPLETED
export const updateAppointmentsToCompleted = async () => {
  try {
    const now = new Date()
    const endOfYesterday = new Date(now)
    endOfYesterday.setDate(endOfYesterday.getDate() - 1)
    endOfYesterday.setHours(23, 59, 59, 999) // End of yesterday

    console.log(`🔄 Checking for appointments to mark as COMPLETED...`)

    // Find appointments that are CONFIRMED and have an end time that was yesterday or earlier
    const appointmentsToUpdate = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        endTime: {
          lte: endOfYesterday, // end time was yesterday or earlier
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

    console.log(`Found ${appointmentsToUpdate.length} appointments to update to COMPLETED`)

    let updatedCount = 0
    let errorCount = 0

    // Update each appointment to COMPLETED
    for (const appointment of appointmentsToUpdate) {
      try {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date()
          },
        })

        // Send notification to user about automatic completion
        await createAndSendNotification(
          appointment.userId,
          'APPOINTMENT_REMINDER',
          'Appointment Automatically Completed',
          `Your appointment "${appointment.title}" has been automatically marked as completed since it has ended (end time: ${new Date(appointment.endTime).toLocaleString()}). The appointment was moved from "Confirmed" to "Completed" status.`,
          {
            appointmentId: appointment.id,
            appointmentTitle: appointment.title,
            oldStatus: 'CONFIRMED',
            newStatus: 'COMPLETED',
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            location: appointment.location
          }
        )

        console.log(`✅ Marked appointment "${appointment.title}" as COMPLETED`)
        updatedCount++
      } catch (appointmentError) {
        console.error(`❌ Error updating appointment "${appointment.title}":`, appointmentError)
        errorCount++
      }
    }

    console.log(`Successfully marked ${updatedCount} appointments as COMPLETED (${errorCount} errors)`)
    return { updatedCount, errorCount, totalFound: appointmentsToUpdate.length }
  } catch (error) {
    console.error('Error updating appointments to COMPLETED:', error)
    throw error
  }
}
