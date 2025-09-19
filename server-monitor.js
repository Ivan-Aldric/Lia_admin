// Server Monitor Script
// This script helps monitor and restart servers if they crash

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServerMonitor {
  constructor() {
    this.backendProcess = null;
    this.frontendProcess = null;
    this.restartCount = { backend: 0, frontend: 0 };
    this.maxRestarts = 5;
  }

  startBackend() {
    console.log('🚀 Starting Backend Server...');
    this.backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true
    });

    this.backendProcess.on('close', (code) => {
      console.log(`❌ Backend server exited with code ${code}`);
      if (this.restartCount.backend < this.maxRestarts) {
        this.restartCount.backend++;
        console.log(`🔄 Restarting backend server (attempt ${this.restartCount.backend})...`);
        setTimeout(() => this.startBackend(), 2000);
      } else {
        console.log('❌ Max restart attempts reached for backend server');
      }
    });

    this.backendProcess.on('error', (err) => {
      console.error('❌ Backend server error:', err);
    });
  }

  startFrontend() {
    console.log('🚀 Starting Frontend Server...');
    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: true
    });

    this.frontendProcess.on('close', (code) => {
      console.log(`❌ Frontend server exited with code ${code}`);
      if (this.restartCount.frontend < this.maxRestarts) {
        this.restartCount.frontend++;
        console.log(`🔄 Restarting frontend server (attempt ${this.restartCount.frontend})...`);
        setTimeout(() => this.startFrontend(), 2000);
      } else {
        console.log('❌ Max restart attempts reached for frontend server');
      }
    });

    this.frontendProcess.on('error', (err) => {
      console.error('❌ Frontend server error:', err);
    });
  }

  start() {
    console.log('🎯 LIA Admin Server Monitor Started');
    console.log('📊 Monitoring both frontend and backend servers...');
    console.log('🔄 Auto-restart enabled (max 5 attempts per server)');
    console.log('');

    this.startBackend();
    setTimeout(() => this.startFrontend(), 3000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      if (this.backendProcess) this.backendProcess.kill();
      if (this.frontendProcess) this.frontendProcess.kill();
      process.exit(0);
    });
  }
}

// Start the monitor
const monitor = new ServerMonitor();
monitor.start();
