#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Lia Admin Backend with PM2...');

// Check if PM2 is installed
const pm2Check = spawn('pm2', ['--version'], { stdio: 'pipe' });

pm2Check.on('error', (error) => {
  console.error('❌ PM2 is not installed. Installing PM2 globally...');
  
  const npmInstall = spawn('npm', ['install', '-g', 'pm2'], { stdio: 'inherit' });
  
  npmInstall.on('close', (code) => {
    if (code === 0) {
      console.log('✅ PM2 installed successfully');
      startPM2();
    } else {
      console.error('❌ Failed to install PM2');
      process.exit(1);
    }
  });
});

pm2Check.on('close', (code) => {
  if (code === 0) {
    console.log('✅ PM2 is already installed');
    startPM2();
  }
});

function startPM2() {
  console.log('🔄 Starting application with PM2...');
  
  const pm2Start = spawn('pm2', ['start', 'ecosystem.config.js'], { 
    stdio: 'inherit',
    cwd: path.join(__dirname)
  });
  
  pm2Start.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Application started successfully with PM2');
      console.log('📊 Use "pm2 status" to check status');
      console.log('📊 Use "pm2 logs" to view logs');
      console.log('📊 Use "pm2 stop lia-admin-backend" to stop');
    } else {
      console.error('❌ Failed to start application with PM2');
      process.exit(1);
    }
  });
}
