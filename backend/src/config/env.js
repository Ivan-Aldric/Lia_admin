/**
 * Environment variable validation
 * Ensures all required environment variables are set
 */

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
  ]

  const missing = []
  const warnings = []

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  // Check JWT_SECRET strength in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters long for production')
      }
      if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-here' || 
          process.env.JWT_SECRET === 'CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_IN_PRODUCTION') {
        warnings.push('JWT_SECRET is using the default/example value - this is insecure!')
      }
    }
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Variable Warnings:')
    warnings.forEach(warning => console.warn(`   - ${warning}`))
  }

  // Log success
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Environment variables validated')
  }
}

/**
 * Get environment-specific configuration
 */
export const getEnvConfig = () => {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    port: parseInt(process.env.PORT) || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    databaseUrl: process.env.DATABASE_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [],
    healthCheckSecret: process.env.HEALTH_CHECK_SECRET,
  }
}

