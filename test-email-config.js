// Simple email configuration test
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Testing Email Configuration...');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Test transporter creation
try {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('✅ Transporter created successfully');

  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful! Server is ready to take our messages');
    }
  });

} catch (error) {
  console.log('❌ Error creating transporter:', error.message);
}
