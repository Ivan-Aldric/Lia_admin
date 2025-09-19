#!/usr/bin/env node

import http from 'http';

const API_BASE = 'http://localhost:5000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkHealth() {
  console.log('🔍 Checking server health...\n');
  
  try {
    // Check basic health
    const health = await makeRequest('/health');
    console.log('✅ Server Status:', health.data.status);
    console.log('⏱️  Uptime:', Math.round(health.data.uptime), 'seconds');
    console.log('🌍 Environment:', health.data.environment);
    
    // Check database health
    try {
      const db = await makeRequest('/health/db');
      console.log('✅ Database Status:', db.data.status);
    } catch (error) {
      console.log('❌ Database Status: ERROR');
      console.log('   Error:', error.message);
    }
    
    // Check memory health
    try {
      const memory = await makeRequest('/health/memory');
      console.log('✅ Memory Status:', memory.data.status);
      console.log('   Heap Used:', memory.data.memory.heapUsed);
      console.log('   RSS:', memory.data.memory.rss);
      
      if (memory.data.isHighMemory) {
        console.log('⚠️  High memory usage detected!');
      }
    } catch (error) {
      console.log('❌ Memory Status: ERROR');
    }
    
    // Check system health
    try {
      const system = await makeRequest('/health/system');
      console.log('\n🎯 Overall System Status:', system.data.status);
      
      if (system.data.status !== 'OK') {
        console.log('⚠️  Some issues detected. Check individual components above.');
      }
    } catch (error) {
      console.log('❌ System Status: ERROR');
    }
    
  } catch (error) {
    console.log('❌ Server is not responding!');
    console.log('   Error:', error.message);
    console.log('   Make sure the server is running on port 5000');
  }
}

// Run health check
checkHealth().catch(console.error);
