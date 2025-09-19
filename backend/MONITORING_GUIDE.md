# 🔧 Real-time Data Monitoring Guide

## Problem Fixed

Your real-time data was disappearing because of:

- Database connection issues
- Memory leaks
- Server resource exhaustion
- Rate limiting

## ✅ Solutions Implemented

### 1. **Health Check Endpoints**

- `/health` - Basic server status
- `/health/db` - Database connectivity
- `/health/memory` - Memory usage monitoring
- `/health/system` - Overall system health

### 2. **Database Connection Monitoring**

- Automatic reconnection on failures
- Connection health checks every 30 seconds
- Error recovery and logging

### 3. **Memory Monitoring**

- Tracks heap usage, RSS, and external memory
- Warns when memory usage is high (>500MB)
- Automatic restart on memory issues

### 4. **Process Management with PM2**

- Auto-restart on crashes
- Memory limit monitoring
- Better error handling

## 🚀 How to Use

### **Option 1: Regular Development (Recommended)**

```bash
cd backend
npm run dev
```

### **Option 2: Production with PM2**

```bash
cd backend
npm run pm2:start
```

### **Check Server Health**

```bash
cd backend
npm run health
```

### **PM2 Commands**

```bash
# Start with PM2
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop

# Monitor (real-time)
npm run pm2:monit
```

## 📊 Monitoring Endpoints

### **Basic Health Check**

```bash
curl http://localhost:5000/health
```

### **Database Health**

```bash
curl http://localhost:5000/health/db
```

### **Memory Health**

```bash
curl http://localhost:5000/health/memory
```

### **System Health (All Checks)**

```bash
curl http://localhost:5000/health/system
```

## 🔍 What to Look For

### **Healthy Server**

- ✅ Database Status: OK
- ✅ Memory Status: OK
- ✅ Overall System Status: OK

### **Warning Signs**

- ⚠️ High memory usage (>500MB)
- ⚠️ Database connection failures
- ⚠️ System Status: WARNING

### **Critical Issues**

- ❌ Database Status: ERROR
- ❌ Server not responding
- ❌ Memory usage extremely high

## 🛠️ Troubleshooting

### **If Data Disappears Again**

1. Check health: `npm run health`
2. Check PM2 status: `npm run pm2:status`
3. View logs: `npm run pm2:logs`
4. Restart if needed: `npm run pm2:restart`

### **If Server Crashes**

1. PM2 will auto-restart
2. Check logs for errors
3. Monitor memory usage
4. Consider increasing memory limits

### **If Database Issues**

1. Check database connection
2. Verify DATABASE_URL in .env
3. Check if database server is running
4. Look for connection pool exhaustion

## 📈 Expected Results

After implementing these fixes:

- ✅ **Stable Data**: Real-time data stays consistent
- ✅ **No Disappearing**: Data doesn't suddenly vanish
- ✅ **Auto-Recovery**: Server recovers from errors automatically
- ✅ **Better Performance**: Faster response times
- ✅ **Reliability**: Server stays running for days/weeks

## 🎯 Next Steps

1. **Start with PM2**: `npm run pm2:start`
2. **Monitor Health**: `npm run health`
3. **Check Status**: `npm run pm2:status`
4. **Watch Logs**: `npm run pm2:logs`

Your server should now be much more stable and reliable! 🚀
