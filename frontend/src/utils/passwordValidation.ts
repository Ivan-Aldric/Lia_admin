/**
 * Password validation utilities
 * Matches backend password requirements
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: number
  strengthText: string
  strengthColor: string
}

/**
 * Validate password against security requirements
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }
  
  const isValid = errors.length === 0
  
  // Calculate strength (0-5)
  let strength = 0
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[a-z]/.test(password)) strength += 1
  if (/\d/.test(password)) strength += 1
  if (/[@$!%*?&]/.test(password)) strength += 1
  
  // Cap at 5
  strength = Math.min(strength, 5)
  
  const strengthText = getStrengthText(strength)
  const strengthColor = getStrengthColor(strength)
  
  return {
    isValid,
    errors,
    strength,
    strengthText,
    strengthColor,
  }
}

/**
 * Get password strength text
 */
export const getStrengthText = (strength: number): string => {
  if (strength <= 1) return 'Very Weak'
  if (strength <= 2) return 'Weak'
  if (strength <= 3) return 'Fair'
  if (strength <= 4) return 'Good'
  if (strength <= 5) return 'Strong'
  return 'Very Strong'
}

/**
 * Get password strength color (Tailwind classes)
 */
export const getStrengthColor = (strength: number): string => {
  if (strength <= 1) return 'bg-red-500'
  if (strength <= 2) return 'bg-orange-500'
  if (strength <= 3) return 'bg-yellow-500'
  if (strength <= 4) return 'bg-blue-500'
  return 'bg-green-500'
}

/**
 * Get password requirements as an array
 */
export const getPasswordRequirements = (): string[] => {
  return [
    'At least 8 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (@$!%*?&)',
  ]
}

/**
 * Check if password meets minimum requirements (quick check)
 */
export const meetsMinimumRequirements = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password)
  )
}

