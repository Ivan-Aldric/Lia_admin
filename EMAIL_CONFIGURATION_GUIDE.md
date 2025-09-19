# 📧 Email Notifications Configuration Guide

## Quick Setup (5 minutes)

### Step 1: Create .env File

Create a `.env` file in your project root with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/lia_admin_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Email Configuration (Nodemailer) - CONFIGURE THESE FOR EMAIL NOTIFICATIONS
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@liaadmin.com"

# SMS Configuration (Twilio) - Optional
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# WhatsApp Configuration - Optional
WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"

# Payment Configuration - Optional
MTN_MOMO_API_URL="https://sandbox.momodeveloper.mtn.com"
MTN_MOMO_SUBSCRIPTION_KEY="your-mtn-subscription-key"
MTN_MOMO_API_USER="your-mtn-api-user"
MTN_MOMO_API_KEY="your-mtn-api-key"

ORANGE_MONEY_API_URL="https://api.orange.com"
ORANGE_MONEY_CLIENT_ID="your-orange-client-id"
ORANGE_MONEY_CLIENT_SECRET="your-orange-client-secret"

# File Upload Configuration
MAX_FILE_SIZE="10485760" # 10MB in bytes
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000" # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

### Step 2: Configure Gmail App Password

#### Option A: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:

   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "LIA Admin" as the name
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env file**:
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="abcd efgh ijkl mnop"  # Use the app password, not your regular password
   ```

#### Option B: Other Email Providers

**Outlook/Hotmail:**

```env
EMAIL_HOST="smtp-mail.outlook.com"
EMAIL_PORT=587
EMAIL_USER="your-email@outlook.com"
EMAIL_PASS="your-password"
```

**Yahoo:**

```env
EMAIL_HOST="smtp.mail.yahoo.com"
EMAIL_PORT=587
EMAIL_USER="your-email@yahoo.com"
EMAIL_PASS="your-app-password"
```

**Custom SMTP:**

```env
EMAIL_HOST="your-smtp-server.com"
EMAIL_PORT=587
EMAIL_USER="your-email@domain.com"
EMAIL_PASS="your-password"
```

### Step 3: Test Email Configuration

Run this command to test your email setup:

```bash
# Test basic email sending
curl -X POST http://localhost:5000/api/test/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

Or use PowerShell:

```powershell
$body = @{ email = "your-email@gmail.com" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/test/test-email" -Method POST -Body $body -ContentType "application/json"
```

### Step 4: Test Task/Appointment Email Notifications

```bash
# Test task email notification
curl -X POST http://localhost:5000/api/test/test-task-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "Test Task",
    "description": "Testing email notifications",
    "dueDate": "2024-12-31"
  }'
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid login" error**:

   - Make sure you're using an App Password, not your regular Gmail password
   - Ensure 2-Factor Authentication is enabled

2. **"Connection timeout" error**:

   - Check your internet connection
   - Verify EMAIL_HOST and EMAIL_PORT are correct

3. **"Authentication failed" error**:

   - Double-check EMAIL_USER and EMAIL_PASS
   - Make sure the email account exists

4. **"Email not received"**:
   - Check spam/junk folder
   - Verify EMAIL_FROM address is valid
   - Check server logs for errors

### Debug Mode:

Add this to your `.env` file to see detailed email logs:

```env
NODE_ENV="development"
DEBUG="nodemailer:*"
```

## 📧 Email Features

### What Gets Sent:

- ✅ **Task Creation**: When user creates a new task
- ✅ **Appointment Creation**: When user creates a new appointment
- ✅ **Task Reminders**: When tasks are due soon
- ✅ **Task Overdue**: When tasks are past due
- ✅ **Appointment Reminders**: Before appointments

### Email Design:

- 🎨 **Professional HTML**: Beautiful, responsive design
- 🏢 **LIA Admin Branding**: Consistent with your app
- 📱 **Mobile Friendly**: Looks great on all devices
- 🔗 **Action Buttons**: Direct links back to your app

## 🚀 Production Setup

For production, consider:

1. **Dedicated Email Service**: Use SendGrid, Mailgun, or AWS SES
2. **Email Templates**: Customize the HTML templates
3. **Rate Limiting**: Prevent email spam
4. **Monitoring**: Track email delivery rates

## 📞 Support

If you need help:

1. Check the server logs for error messages
2. Test with a simple email first
3. Verify all environment variables are set correctly
4. Make sure the backend server is running

---

**Ready to go!** Once configured, users will automatically receive professional email notifications when they create tasks or appointments. 🎉
