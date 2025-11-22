/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error for debugging
  console.error('Error:', err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'P2025') {
    const message = 'Record not found'
    error = { message, statusCode: 404 }
  }

  // Default error response
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Sanitize error messages in production to prevent information disclosure
  const sanitizedMessage = isDevelopment 
    ? message 
    : (statusCode >= 500 
      ? 'An error occurred. Please try again later.' 
      : message) // Keep client errors (4xx) as-is, sanitize server errors (5xx)

  res.status(statusCode).json({
    success: false,
    error: sanitizedMessage,
    ...(isDevelopment && { 
      stack: err.stack,
      details: message 
    })
  })
}
