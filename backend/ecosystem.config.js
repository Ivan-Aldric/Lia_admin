module.exports = {
  apps: [{
    name: 'lia-admin-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart if memory usage exceeds 500MB
    max_memory_restart: '500M',
    // Restart if app crashes
    min_uptime: '10s',
    max_restarts: 10,
    // Health check
    health_check_grace_period: 3000,
    // Kill timeout
    kill_timeout: 5000
  }]
}
