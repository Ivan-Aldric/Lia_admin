import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Import routes
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import appointmentRoutes from './routes/appointments.js'
import financeRoutes from './routes/finance.js'
import notificationRoutes from './routes/notifications.js'
import settingsRoutes from './routes/settings.js'
import testNotificationRoutes from './routes/test-notifications.js'
import dashboardRoutes from './routes/dashboard.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Import services
import { startNotificationCron } from './services/cronService.js'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Initialize Prisma client with connection pooling and error handling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  errorFormat: 'pretty',
})

// Add error recovery and connection monitoring
prisma.$on('error', (e) => {
  console.error('Database error:', e)
  // Attempt to reconnect
  prisma.$connect().catch(err => {
    console.error('Failed to reconnect to database:', err)
  })
})

// Monitor connection status
let connectionRetries = 0
const maxRetries = 5

const checkConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    connectionRetries = 0
    console.log('✅ Database connection healthy')
  } catch (error) {
    connectionRetries++
    console.error(`❌ Database connection failed (attempt ${connectionRetries}/${maxRetries}):`, error.message)
    
    if (connectionRetries < maxRetries) {
      setTimeout(() => {
        prisma.$connect().catch(err => {
          console.error('Failed to reconnect:', err)
        })
      }, 5000) // Retry after 5 seconds
    } else {
      console.error('🚨 Max database reconnection attempts reached. Server may become unstable.')
    }
  }
}

// Check connection every 30 seconds
setInterval(checkConnection, 30000)

// Rate limiting - very generous limits for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // Very high limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and API routes in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return true // Skip rate limiting entirely in development
    }
    return req.path.startsWith('/health')
  }
})

// Middleware
app.use(helmet()) // Security headers
app.use(compression()) // Compress responses
app.use(morgan('combined')) // Logging
app.use(limiter) // Rate limiting
// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3000'
]

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json({ limit: '10mb' })) // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })) // Parse URL-encoded bodies

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Memory health check
app.get('/health/memory', (req, res) => {
  const memUsage = process.memoryUsage()
  const memInfo = {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) + ' MB'
  }
  
  // Check if memory usage is high (over 500MB)
  const isHighMemory = memUsage.heapUsed > 500 * 1024 * 1024
  
  res.json({
    status: isHighMemory ? 'WARNING' : 'OK',
    memory: memInfo,
    isHighMemory,
    timestamp: new Date().toISOString()
  })
})

// System health check (combines all checks)
app.get('/health/system', async (req, res) => {
  const checks = {
    server: { status: 'OK', uptime: process.uptime() },
    database: { status: 'UNKNOWN' },
    memory: { status: 'UNKNOWN' }
  }
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'OK' }
  } catch (error) {
    checks.database = { status: 'ERROR', error: error.message }
  }
  
  // Check memory
  const memUsage = process.memoryUsage()
  const isHighMemory = memUsage.heapUsed > 500 * 1024 * 1024
  checks.memory = {
    status: isHighMemory ? 'WARNING' : 'OK',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
  }
  
  const overallStatus = Object.values(checks).every(check => check.status === 'OK') ? 'OK' : 'WARNING'
  
  res.status(overallStatus === 'OK' ? 200 : 500).json({
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/test', testNotificationRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 handler
app.use(notFound)

// Error handler
app.use(errorHandler)

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...')
  await prisma.$disconnect()
  process.exit(0)
})

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`)
  console.log(`🏥 Health Checks: http://localhost:${PORT}/health/system`)
  
  // Test database connection on startup
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection established')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  }
  
  // Start notification cron jobs
  startNotificationCron()
  
  // Initial connection check
  checkConnection()
})

export default app
