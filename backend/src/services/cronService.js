import { checkOverdueTasks, checkTasksDueSoon, checkUpcomingAppointments, updateTasksToInProgress, checkDayBeforeReminders, checkDueTodayReminders, updateOverdueTasksToCompleted, updateAppointmentsToConfirmed, updateAppointmentsToCompleted } from './notificationTriggers.js'

// Cron job to check for notifications every hour
export const startNotificationCron = () => {
  console.log('🕐 Starting notification cron jobs...')
  
  // Check every hour (3600000 ms)
  setInterval(async () => {
    console.log('🔔 Running notification checks...')
    
    try {
      // Check for overdue tasks
      await checkOverdueTasks()
      
      // Check for tasks due soon
      await checkTasksDueSoon()
      
      // Check for upcoming appointments
      await checkUpcomingAppointments()
      
      // Check for day-before reminders (7 AM and 8 PM)
      await checkDayBeforeReminders()
      
      // Check for due-today reminders (6 AM)
      await checkDueTodayReminders()
      
      // Check for overdue tasks to mark as completed
      await updateOverdueTasksToCompleted()
      
      // Check for appointments to mark as confirmed
      await updateAppointmentsToConfirmed()
      
      // Check for appointments to mark as completed
      await updateAppointmentsToCompleted()
      
      console.log('✅ Notification checks completed')
    } catch (error) {
      console.error('❌ Error in notification cron:', error)
    }
  }, 3600000) // 1 hour

  // Check for task status updates every 6 hours (21600000 ms)
  setInterval(async () => {
    console.log('🔄 Running task status update checks...')
    
    try {
      // Update tasks from PENDING to IN_PROGRESS when due date is reached
      await updateTasksToInProgress()
      
      console.log('✅ Task status update checks completed')
    } catch (error) {
      console.error('❌ Error in task status update cron:', error)
    }
  }, 21600000) // 6 hours

  // Also run immediately on startup
  setTimeout(async () => {
    console.log('🚀 Running initial notification check...')
    try {
      await checkOverdueTasks()
      await checkTasksDueSoon()
      await checkUpcomingAppointments()
      await checkDayBeforeReminders()
      await checkDueTodayReminders()
      await updateOverdueTasksToCompleted()
      await updateAppointmentsToConfirmed()
      await updateAppointmentsToCompleted()
      await updateTasksToInProgress()
      console.log('✅ Initial notification check completed')
    } catch (error) {
      console.error('❌ Error in initial notification check:', error)
    }
  }, 5000) // Run after 5 seconds
}

// Manual trigger for testing
export const triggerNotificationCheck = async () => {
  console.log('🔔 Manual notification check triggered...')
  try {
    await checkOverdueTasks()
    await checkTasksDueSoon()
    await checkUpcomingAppointments()
    await checkDayBeforeReminders()
    await checkDueTodayReminders()
    await updateOverdueTasksToCompleted()
    await updateAppointmentsToConfirmed()
    await updateAppointmentsToCompleted()
    await updateTasksToInProgress()
    console.log('✅ Manual notification check completed')
  } catch (error) {
    console.error('❌ Error in manual notification check:', error)
  }
}
