#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

const API_BASE = 'http://localhost:5000';

// Colors for console output
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  reset: chalk.reset
};

async function checkHealth() {
  try {
    console.log(colors.info('🔍 Checking server health...\n'));
    
    // Check basic health
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(colors.success('✅ Server Status:'), healthResponse.data.status);
    console.log(colors.info('⏱️  Uptime:'), Math.round(healthResponse.data.uptime), 'seconds');
    console.log(colors.info('🌍 Environment:'), healthResponse.data.environment);
    
    // Check database health
    try {
      const dbResponse = await axios.get(`${API_BASE}/health/db`);
      console.log(colors.success('✅ Database Status:'), dbResponse.data.status);
    } catch (error) {
      console.log(colors.error('❌ Database Status:'), 'ERROR');
      console.log(colors.error('   Error:'), error.response?.data?.error || error.message);
    }
    
    // Check memory health
    try {
      const memoryResponse = await axios.get(`${API_BASE}/health/memory`);
      const status = memoryResponse.data.status;
      const color = status === 'OK' ? colors.success : colors.warning;
      console.log(color(`✅ Memory Status: ${status}`));
      console.log(colors.info('   Heap Used:'), memoryResponse.data.memory.heapUsed);
      console.log(colors.info('   RSS:'), memoryResponse.data.memory.rss);
      
      if (memoryResponse.data.isHighMemory) {
        console.log(colors.warning('⚠️  High memory usage detected!'));
      }
    } catch (error) {
      console.log(colors.error('❌ Memory Status:'), 'ERROR');
    }
    
    // Check system health
    try {
      const systemResponse = await axios.get(`${API_BASE}/health/system`);
      const status = systemResponse.data.status;
      const color = status === 'OK' ? colors.success : colors.warning;
      console.log(color(`\n🎯 Overall System Status: ${status}`));
      
      if (status !== 'OK') {
        console.log(colors.warning('⚠️  Some issues detected. Check individual components above.'));
      }
    } catch (error) {
      console.log(colors.error('❌ System Status:'), 'ERROR');
    }
    
  } catch (error) {
    console.log(colors.error('❌ Server is not responding!'));
    console.log(colors.error('   Error:'), error.message);
    console.log(colors.info('   Make sure the server is running on port 5000'));
  }
}

async function monitor() {
  console.log(colors.info('🚀 Starting Lia Admin Backend Monitor\n'));
  
  // Initial check
  await checkHealth();
  
  // Monitor every 30 seconds
  setInterval(async () => {
    console.log(colors.reset('\n' + '='.repeat(50)));
    console.log(colors.info(`🕐 ${new Date().toLocaleTimeString()}`));
    await checkHealth();
  }, 30000);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(colors.info('\n👋 Monitor stopped'));
  process.exit(0);
});

// Start monitoring
monitor().catch(console.error);
