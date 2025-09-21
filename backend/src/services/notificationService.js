import nodemailer from 'nodemailer'
import twilio from 'twilio'

// Initialize Twilio client only if credentials are provided
let twilioClient = null
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  } catch (error) {
    console.warn('⚠️ Twilio not configured properly:', error.message)
  }
}

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Professional email template generator
const generateEmailTemplate = (notification, logoUrl = null) => {
  const currentYear = new Date().getFullYear()
  const notificationType = notification.type.replace(/_/g, ' ').toLowerCase()
  const notificationIcon = getNotificationIcon(notification.type)

  // Parse data payload if present (stringified in DB)
  let payload = null
  try {
    if (notification.data) {
      payload = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data
    }
  } catch (_) {
    payload = null
  }

  // Build context-aware detail rows
  const detailRows = []
  // Common
  detailRows.push(
    `<div class="detail-row"><span class="detail-label">Notification Type</span><span class="detail-value">${notification.type.replace(/_/g, ' ')}</span></div>`
  )
  const createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date()
  detailRows.push(
    `<div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${createdAt.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span></div>`
  )
  detailRows.push(
    `<div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value">${getNotificationPriority(notification.type)}</span></div>`
  )

  // Task-specific
  if (payload?.taskId || payload?.taskTitle || payload?.dueDate || payload?.oldStatus || payload?.newStatus) {
    if (payload.taskTitle) {
      detailRows.push(`<div class="detail-row"><span class="detail-label">Task</span><span class="detail-value">${payload.taskTitle}</span></div>`) 
    }
    if (payload.dueDate) {
      const d = new Date(payload.dueDate)
      detailRows.push(`<div class="detail-row"><span class="detail-label">Due Date</span><span class="detail-value">${d.toLocaleString()}</span></div>`) 
    }
    if (payload.oldStatus || payload.newStatus) {
      detailRows.push(`<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${payload.oldStatus ? `${payload.oldStatus} → ` : ''}${payload.newStatus || ''}</span></div>`) 
    }
  }

  // Appointment-specific
  if (payload?.appointmentId || payload?.appointmentTitle || payload?.startTime || payload?.endTime || payload?.location) {
    if (payload.appointmentTitle) {
      detailRows.push(`<div class="detail-row"><span class="detail-label">Appointment</span><span class="detail-value">${payload.appointmentTitle}</span></div>`) 
    }
    if (payload.startTime) {
      const s = new Date(payload.startTime)
      detailRows.push(`<div class="detail-row"><span class="detail-label">Starts</span><span class="detail-value">${s.toLocaleString()}</span></div>`) 
    }
    if (payload.endTime) {
      const e = new Date(payload.endTime)
      detailRows.push(`<div class="detail-row"><span class="detail-label">Ends</span><span class="detail-value">${e.toLocaleString()}</span></div>`) 
    }
    if (payload.location) {
      detailRows.push(`<div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${payload.location}</span></div>`) 
    }
  }

  // Finance-specific
  if (payload?.transactionId || payload?.amount || payload?.title) {
    if (payload.title) {
      detailRows.push(`<div class="detail-row"><span class="detail-label">Transaction</span><span class="detail-value">${payload.title}</span></div>`) 
    }
    if (payload.amount !== undefined && payload.amount !== null) {
      const amt = Number(payload.amount)
      const formatted = isNaN(amt) ? payload.amount : amt.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
      detailRows.push(`<div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">${formatted}</span></div>`) 
    }
  }

  // Build CTA target based on context
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  let ctaHref = `${baseUrl}/app/notifications`
  let ctaText = 'View in LIA Admin Dashboard'
  if (payload?.taskId) {
    ctaHref = `${baseUrl}/app/tasks/${payload.taskId}`
    ctaText = 'Open Task'
  } else if (payload?.appointmentId) {
    ctaHref = `${baseUrl}/app/appointments/${payload.appointmentId}`
    ctaText = 'Open Appointment'
  } else if (notification.type?.startsWith('PAYMENT') || payload?.transactionId) {
    ctaHref = `${baseUrl}/app/finance`
    ctaText = 'Open Finance'
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LIA Admin - ${notification.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background-color: #f8fafc;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
          padding: 32px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .logo-container {
          position: relative;
          z-index: 1;
        }
        
        .logo {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .logo img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .logo-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 4px 0 0 0;
          font-weight: 400;
        }
        
        .content {
          padding: 40px 32px;
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border-left: 4px solid #4f46e5;
        }
        
        .notification-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
        }
        
        .notification-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .notification-type {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        
        .message-content {
          background: #ffffff;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .message-text {
          font-size: 16px;
          color: #374151;
          line-height: 1.7;
          margin: 0;
        }
        
        .notification-details {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .detail-value {
          color: #6b7280;
          font-size: 14px;
        }
        
        .cta-container {
          text-align: center;
          margin: 32px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(79, 70, 229, 0.6);
        }
        
        .footer {
          background: #f8fafc;
          padding: 32px 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }
        
        .footer-links {
          margin: 16px 0;
        }
        
        .footer-link {
          color: #4f46e5;
          text-decoration: none;
          font-size: 14px;
          margin: 0 12px;
        }
        
        .footer-link:hover {
          text-decoration: underline;
        }
        
        .copyright {
          color: #9ca3af;
          font-size: 12px;
          margin: 16px 0 0 0;
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 24px 0;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .content {
            padding: 24px 20px;
          }
          
          .header {
            padding: 24px 20px;
          }
          
          .notification-header {
            flex-direction: column;
            text-align: center;
          }
          
          .notification-icon {
            margin: 0 0 12px 0;
          }
          
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
          <div class="logo-container">
            <div class="logo">
              ${logoUrl ? 
                `<img src="${logoUrl}" alt="LIA Admin Logo" style="width: 40px; height: 40px;">` : 
                `<div style="font-size: 24px; color: white;">📋</div>`
              }
            </div>
            <h1 class="logo-text">LIA Admin</h1>
            <p class="logo-subtitle">Life Intelligence Assistant</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <!-- Notification Header -->
          <div class="notification-header">
            <div class="notification-icon">
              ${notificationIcon}
            </div>
            <div>
              <h2 class="notification-title">${notification.title}</h2>
              <p class="notification-type">${notificationType}</p>
            </div>
          </div>
          
          <!-- Message Content -->
          <div class="message-content">
            <p class="message-text">${notification.message}</p>
          </div>
          
          <!-- Notification Details -->
          <div class="notification-details">
            ${detailRows.join('')}
            </div>
            
          <!-- Call to Action -->
          <div class="cta-container">
            <a href="${ctaHref}" class="cta-button">${ctaText}</a>
            </div>
          </div>
          
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated notification from LIA Admin. You can manage your notification preferences in your account settings.
          </p>
          
          <div class="divider"></div>
          
          <div class="footer-links">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/dashboard" class="footer-link">Dashboard</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/notifications" class="footer-link">Notifications</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/settings" class="footer-link">Settings</a>
          </div>
          
          <p class="copyright">
            © ${currentYear} LIA Admin. All rights reserved. | Life Intelligence Assistant
          </p>
          </div>
        </div>
    </body>
    </html>
  `
}

// Helper function to get notification icon
const getNotificationIcon = (type) => {
  const icons = {
    'TASK_REMINDER': '📋',
    'TASK_CREATED': '✅',
    'TASK_DUE_SOON': '⏰',
    'TASK_OVERDUE': '🚨',
    'TASK_COMPLETED': '🎉',
    'APPOINTMENT_REMINDER': '📅',
    'APPOINTMENT_CREATED': '📝',
    'APPOINTMENT_CANCELLED': '❌',
    'PAYMENT_DUE': '💰',
    'LARGE_EXPENSE': '💸',
    'SYSTEM_UPDATE': '🔧',
    'GENERAL': '🔔'
  }
  return icons[type] || '🔔'
}

// Helper function to get notification priority
const getNotificationPriority = (type) => {
  const priorities = {
    'TASK_OVERDUE': 'High',
    'APPOINTMENT_REMINDER': 'High',
    'PAYMENT_DUE': 'High',
    'TASK_DUE_SOON': 'Medium',
    'TASK_REMINDER': 'Medium',
    'LARGE_EXPENSE': 'Medium',
    'TASK_CREATED': 'Low',
    'TASK_COMPLETED': 'Low',
    'APPOINTMENT_CREATED': 'Low',
    'APPOINTMENT_CANCELLED': 'Low',
    'SYSTEM_UPDATE': 'Low',
    'GENERAL': 'Low'
  }
  return priorities[type] || 'Low'
}

// Email notification service
export const sendEmailNotification = async (userEmail, notification, logoUrl = null) => {
  try {
    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'LIA Admin <noreply@liaadmin.com>',
      to: userEmail,
      subject: `LIA Admin - ${notification.title}`,
      html: generateEmailTemplate(notification, logoUrl),
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// SMS notification service
export const sendSMSNotification = async (phoneNumber, notification) => {
  if (!twilioClient) {
    console.warn('⚠️ SMS notifications not configured - Twilio credentials missing')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const message = `LIA Admin: ${notification.title}\n\n${notification.message}\n\nView details: ${process.env.FRONTEND_URL}/app/notifications`
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    })

    console.log('SMS sent successfully:', result.sid)
    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error('SMS sending failed:', error)
    return { success: false, error: error.message }
  }
}

// WhatsApp notification service
export const sendWhatsAppNotification = async (phoneNumber, notification) => {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('⚠️ WhatsApp notifications not configured - API credentials missing')
    return { success: false, error: 'WhatsApp service not configured' }
  }

  try {
    const message = `*LIA Admin Notification*\n\n*${notification.title}*\n\n${notification.message}\n\n_View details: ${process.env.FRONTEND_URL}/app/notifications_`
    
    const response = await fetch(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    )

    const result = await response.json()
    
    if (response.ok) {
      console.log('WhatsApp message sent successfully:', result.messages[0].id)
      return { success: true, messageId: result.messages[0].id }
    } else {
      throw new Error(result.error?.message || 'WhatsApp API error')
    }
  } catch (error) {
    console.error('WhatsApp sending failed:', error)
    return { success: false, error: error.message }
  }
}

// Main notification dispatcher
export const sendNotification = async (userId, notification, userSettings, user) => {
  const results = {
    email: null,
    sms: null,
    whatsapp: null,
  }

  // Send email notification if enabled
  if (userSettings.emailNotifications && user.email) {
    results.email = await sendEmailNotification(user.email, notification, process.env.EMAIL_LOGO_URL)
  }

  // Send SMS notification if enabled (requires phone number in user model)
  if (userSettings.smsNotifications && user.phoneNumber) {
    results.sms = await sendSMSNotification(user.phoneNumber, notification)
  }

  // Send WhatsApp notification if enabled (requires phone number in user model)
  if (userSettings.whatsappNotifications && user.phoneNumber) {
    results.whatsapp = await sendWhatsAppNotification(user.phoneNumber, notification)
  }

  return results
}

// Notification templates
export const notificationTemplates = {
  TASK_REMINDER: {
    title: 'Task Reminder',
    getMessage: (task) => `Task "${task.title}" is due ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'}.`,
  },
  APPOINTMENT_REMINDER: {
    title: 'Appointment Reminder',
    getMessage: (appointment) => `You have an appointment "${appointment.title}" at ${new Date(appointment.startTime).toLocaleString()}.`,
  },
  PAYMENT_DUE: {
    title: 'Payment Due',
    getMessage: (transaction) => `Payment of $${transaction.amount} for "${transaction.title}" is due.`,
  },
  SYSTEM_UPDATE: {
    title: 'System Update',
    getMessage: (data) => data.message || 'A system update has been applied.',
  },
  GENERAL: {
    title: 'General Notification',
    getMessage: (data) => data.message || 'You have a new notification.',
  },
}
