import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@liaadmin.com' },
    update: {},
    create: {
      email: 'test@liaadmin.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    },
  })

  console.log('✅ Created test user:', user.email)

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'system',
      emailNotifications: true,
      smsNotifications: false,
      whatsappNotifications: false,
      language: 'en',
      timezone: 'UTC',
      profileVisibility: 'private',
    },
  })

  console.log('✅ Created user settings')

  // Create sample tasks
  const tasks = [
    {
      title: 'Complete project proposal',
      description: 'Finish the Q1 project proposal and submit to management',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date('2024-01-15'),
      userId: user.id,
    },
    {
      title: 'Review quarterly reports',
      description: 'Go through all quarterly financial reports',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-01-16'),
      userId: user.id,
    },
    {
      title: 'Schedule team meeting',
      description: 'Organize weekly team standup meeting',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: new Date('2024-01-14'),
      userId: user.id,
    },
  ]

  for (const taskData of tasks) {
    await prisma.task.create({
      data: taskData,
    })
  }

  console.log('✅ Created sample tasks')

  // Create sample appointments
  const appointments = [
    {
      title: 'Doctor Appointment',
      description: 'Annual checkup with Dr. Smith',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T11:00:00'),
      location: 'City Medical Center',
      status: 'SCHEDULED',
      userId: user.id,
    },
    {
      title: 'Team Standup',
      description: 'Daily team standup meeting',
      startTime: new Date('2024-01-15T14:00:00'),
      endTime: new Date('2024-01-15T14:30:00'),
      location: 'Conference Room A',
      status: 'CONFIRMED',
      userId: user.id,
    },
  ]

  for (const appointmentData of appointments) {
    await prisma.appointment.create({
      data: appointmentData,
    })
  }

  console.log('✅ Created sample appointments')

  // Create sample transactions
  const transactions = [
    {
      title: 'Salary',
      description: 'Monthly salary payment',
      amount: 5000.00,
      type: 'INCOME',
      category: 'Salary',
      date: new Date('2024-01-01'),
      userId: user.id,
    },
    {
      title: 'Grocery Shopping',
      description: 'Weekly grocery shopping',
      amount: -150.75,
      type: 'EXPENSE',
      category: 'Food & Dining',
      date: new Date('2024-01-05'),
      userId: user.id,
    },
    {
      title: 'Rent Payment',
      description: 'Monthly rent payment',
      amount: -1200.00,
      type: 'EXPENSE',
      category: 'Housing',
      date: new Date('2024-01-01'),
      userId: user.id,
    },
  ]

  for (const transactionData of transactions) {
    await prisma.transaction.create({
      data: transactionData,
    })
  }

  console.log('✅ Created sample transactions')

  // Create sample notifications
  const notifications = [
    {
      title: 'Task Reminder',
      message: 'Task "Complete project proposal" is due tomorrow',
      type: 'TASK_REMINDER',
      userId: user.id,
    },
    {
      title: 'Appointment Reminder',
      message: 'You have an appointment with Dr. Smith in 1 hour',
      type: 'APPOINTMENT_REMINDER',
      userId: user.id,
    },
    {
      title: 'Welcome to LIA Admin',
      message: 'Welcome to your Life Admin Assistant! Start by exploring the dashboard.',
      type: 'GENERAL',
      userId: user.id,
    },
  ]

  for (const notificationData of notifications) {
    await prisma.notification.create({
      data: notificationData,
    })
  }

  console.log('✅ Created sample notifications')

  console.log('🎉 Database seed completed successfully!')
  console.log('📧 Test user email: test@liaadmin.com')
  console.log('🔑 Test user password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
