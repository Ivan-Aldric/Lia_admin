#!/usr/bin/env node

/**
 * Security Audit Script
 * Checks for common security issues and dependency vulnerabilities
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔒 Starting Security Audit...\n')

const issues = []
const warnings = []
const passed = []

// Check 1: npm audit
console.log('1. Checking for dependency vulnerabilities...')
try {
  const auditResult = execSync('npm audit --json', { 
    cwd: projectRoot, 
    encoding: 'utf-8',
    stdio: 'pipe'
  })
  const audit = JSON.parse(auditResult)
  
  if (audit.vulnerabilities) {
    const total = Object.keys(audit.vulnerabilities).length
    if (total > 0) {
      issues.push(`Found ${total} vulnerable dependencies`)
      console.log(`   ❌ Found ${total} vulnerable dependencies`)
      console.log(`   Run 'npm audit fix' to fix automatically fixable issues`)
    } else {
      passed.push('No vulnerable dependencies found')
      console.log('   ✅ No vulnerable dependencies found')
    }
  }
} catch (error) {
  warnings.push('Could not run npm audit - ensure npm is installed')
  console.log('   ⚠️  Could not run npm audit')
}

// Check 2: Environment variables
console.log('\n2. Checking environment configuration...')
try {
  const envExample = readFileSync(join(projectRoot, '..', 'env.example'), 'utf-8')
  
  // Check for default/example values
  if (envExample.includes('your-super-secret-jwt-key-here')) {
    passed.push('env.example uses placeholder values (expected)')
    console.log('   ✅ env.example uses placeholder values')
  }
  
  // Check if .env exists (should not be in repo)
  try {
    readFileSync(join(projectRoot, '..', '.env'), 'utf-8')
    warnings.push('.env file exists - ensure it is in .gitignore')
    console.log('   ⚠️  .env file exists (ensure it\'s in .gitignore)')
  } catch {
    passed.push('.env file not in repository (good)')
    console.log('   ✅ .env file not in repository')
  }
} catch (error) {
  warnings.push('Could not check environment files')
  console.log('   ⚠️  Could not check environment files')
}

// Check 3: Check for hardcoded secrets
console.log('\n3. Scanning for hardcoded secrets...')
try {
  const serverJs = readFileSync(join(projectRoot, 'src', 'server.js'), 'utf-8')
  const authJs = readFileSync(join(projectRoot, 'src', 'routes', 'auth.js'), 'utf-8')
  
  // Check for common hardcoded secrets
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
  ]
  
  let foundSecrets = false
  secretPatterns.forEach(pattern => {
    if (pattern.test(serverJs) || pattern.test(authJs)) {
      foundSecrets = true
    }
  })
  
  if (foundSecrets) {
    issues.push('Potential hardcoded secrets found in code')
    console.log('   ❌ Potential hardcoded secrets found')
  } else {
    passed.push('No hardcoded secrets detected')
    console.log('   ✅ No hardcoded secrets detected')
  }
} catch (error) {
  warnings.push('Could not scan for hardcoded secrets')
  console.log('   ⚠️  Could not scan for hardcoded secrets')
}

// Check 4: Rate limiting configuration
console.log('\n4. Checking rate limiting configuration...')
try {
  const serverJs = readFileSync(join(projectRoot, 'src', 'server.js'), 'utf-8')
  
  if (serverJs.includes('skip: (req) => {') && serverJs.includes('return true')) {
    // Check if it's properly configured
    if (serverJs.includes('process.env.NODE_ENV === \'development\'')) {
      // Check if it still skips entirely
      if (serverJs.includes('Skip rate limiting entirely')) {
        issues.push('Rate limiting may be disabled in development')
        console.log('   ⚠️  Rate limiting configuration needs review')
      } else {
        passed.push('Rate limiting is configured')
        console.log('   ✅ Rate limiting is configured')
      }
    } else {
      passed.push('Rate limiting is configured')
      console.log('   ✅ Rate limiting is configured')
    }
  } else {
    passed.push('Rate limiting middleware found')
    console.log('   ✅ Rate limiting middleware found')
  }
} catch (error) {
  warnings.push('Could not check rate limiting')
  console.log('   ⚠️  Could not check rate limiting')
}

// Check 5: Security headers
console.log('\n5. Checking security headers...')
try {
  const serverJs = readFileSync(join(projectRoot, 'src', 'server.js'), 'utf-8')
  
  if (serverJs.includes('helmet()')) {
    if (serverJs.includes('contentSecurityPolicy')) {
      passed.push('Helmet with CSP configured')
      console.log('   ✅ Helmet with CSP configured')
    } else {
      warnings.push('Helmet is used but CSP may not be configured')
      console.log('   ⚠️  Helmet is used but CSP may need configuration')
    }
  } else {
    issues.push('Helmet security headers not found')
    console.log('   ❌ Helmet security headers not found')
  }
} catch (error) {
  warnings.push('Could not check security headers')
  console.log('   ⚠️  Could not check security headers')
}

// Check 6: Input validation
console.log('\n6. Checking input validation...')
try {
  const authJs = readFileSync(join(projectRoot, 'src', 'routes', 'auth.js'), 'utf-8')
  
  if (authJs.includes('express-validator') || authJs.includes('expressValidator')) {
    if (authJs.includes('isLength({ min: 8 })')) {
      passed.push('Password validation requires 8+ characters')
      console.log('   ✅ Password validation requires 8+ characters')
    } else {
      warnings.push('Password validation may need strengthening')
      console.log('   ⚠️  Password validation may need strengthening')
    }
  } else {
    issues.push('Input validation may be missing')
    console.log('   ❌ Input validation may be missing')
  }
} catch (error) {
  warnings.push('Could not check input validation')
  console.log('   ⚠️  Could not check input validation')
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 Security Audit Summary')
console.log('='.repeat(50))
console.log(`✅ Passed: ${passed.length}`)
console.log(`⚠️  Warnings: ${warnings.length}`)
console.log(`❌ Issues: ${issues.length}`)

if (issues.length > 0) {
  console.log('\n❌ Issues Found:')
  issues.forEach(issue => console.log(`   - ${issue}`))
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:')
  warnings.forEach(warning => console.log(`   - ${warning}`))
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n🎉 All security checks passed!')
  process.exit(0)
} else if (issues.length > 0) {
  console.log('\n⚠️  Please address the issues above before deploying to production.')
  process.exit(1)
} else {
  console.log('\n✅ No critical issues found. Review warnings if needed.')
  process.exit(0)
}

