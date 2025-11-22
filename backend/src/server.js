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
import { sanitizeInput } from './middleware/sanitize.js'

// Import services
import { startNotificationCron } from './services/cronService.js'

// Import config
import { validateEnv } from './config/env.js'

// Load environment variables
dotenv.config()

// Validate environment variables
try {
  validateEnv()
} catch (error) {
  console.error('❌ Environment validation failed:', error.message)
  process.exit(1)
}

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

// Rate limiting - different limits for dev vs production, but always enforced
const isDevelopment = process.env.NODE_ENV === 'development'
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDevelopment 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000 // More lenient in dev, but still limited
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Stricter in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only skip health checks, never skip entirely
  skip: (req) => {
    return req.path.startsWith('/health')
  }
})

// Request ID tracking for security monitoring
import crypto from 'crypto'
app.use((req, res, next) => {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
})

// Middleware
// Enhanced security headers with CSP and HSTS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false, // Allow external resources if needed
}))
app.use(compression()) // Compress responses
app.use(morgan('combined')) // Logging
app.use(limiter) // Rate limiting

// CORS configuration - use environment variables, no hardcoded IPs
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  }
  // Default to frontend URL or common dev ports
  const defaultOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ]
  return defaultOrigins
}

const allowedOrigins = getAllowedOrigins()

app.use((req, res, next) => {
  const origin = req.headers.origin
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return next()
  }
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else {
    // Log unauthorized origin attempts in production
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Blocked CORS request from unauthorized origin: ${origin}`)
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Skip-Auth-Redirect')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Request size limits - reduced for better security
const jsonLimit = process.env.MAX_REQUEST_SIZE || '1mb'
app.use(express.json({ limit: jsonLimit })) // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: jsonLimit })) // Parse URL-encoded bodies

// Input sanitization - sanitize all user input to prevent XSS
app.use(sanitizeInput)

// Health check authentication middleware
const healthAuth = (req, res, next) => {
  // In development, allow without auth for convenience
  if (process.env.NODE_ENV === 'development') {
    return next()
  }
  
  // In production, require authentication
  const authHeader = req.headers.authorization
  const healthSecret = process.env.HEALTH_CHECK_SECRET
  
  if (!healthSecret) {
    // If no secret is set, allow access but log warning
    console.warn('⚠️  HEALTH_CHECK_SECRET not set - health endpoints are publicly accessible')
    return next()
  }
  
  if (authHeader === `Bearer ${healthSecret}`) {
    return next()
  }
  
  res.status(401).json({ 
    error: 'Unauthorized',
    message: 'Health check endpoints require authentication'
  })
}

// Health check endpoints - protected in production
app.get('/health', healthAuth, (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Database health check
app.get('/health/db', healthAuth, async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    // Don't expose detailed error in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Database connection failed'
      : error.message
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage }),
      timestamp: new Date().toISOString()
    })
  }
})

// Memory health check
app.get('/health/memory', healthAuth, (req, res) => {
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
app.get('/health/system', healthAuth, async (req, res) => {
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
    checks.database = { 
      status: 'ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    }
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
