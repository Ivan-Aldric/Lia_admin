# 🔧 LIA Admin Troubleshooting Guide

## Data Disappearing Issue - Solutions

### 🚨 **Quick Fix**

If your data suddenly disappears:

1. **Refresh the browser** (Ctrl+F5 for hard refresh)
2. **Check if servers are running**:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173
3. **Restart servers** if needed

### 🔍 **Common Causes & Solutions**

#### 1. **Server Crashes/Restarts**

**Symptoms**: Data loads initially, then disappears after some time
**Causes**:

- File changes triggering auto-restart
- Memory issues
- Port conflicts
- Code errors

**Solutions**:

```bash
# Use the provided scripts
./start-servers.ps1    # Windows PowerShell
./start-servers.bat    # Windows Batch
node server-monitor.js # Cross-platform monitor
```

#### 2. **Authentication Token Expiration**

**Symptoms**: API calls return 401/403 errors
**Causes**:

- Token expires after inactivity
- Invalid token in localStorage

**Solutions**:

- Log out and log back in
- Clear browser localStorage
- Check browser console for auth errors

#### 3. **Database Connection Issues**

**Symptoms**: Data doesn't load, 500 errors
**Causes**:

- Database server not running
- Connection timeout
- Prisma client issues

**Solutions**:

```bash
# Restart database (if using local PostgreSQL)
# Or check your DATABASE_URL in .env
cd backend
npx prisma generate
npx prisma db push
```

#### 4. **Browser Cache Issues**

**Symptoms**: Old data shows, new data doesn't appear
**Solutions**:

- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Open in incognito/private mode

#### 5. **Network/Port Issues**

**Symptoms**: Connection refused, can't reach server
**Solutions**:

```bash
# Check if ports are in use
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Kill processes if needed
taskkill /PID <PID_NUMBER> /F
```

### 🛠️ **Prevention Tips**

1. **Keep Both Servers Running**:

   - Don't close terminal windows
   - Use the provided startup scripts
   - Monitor server logs for errors

2. **Regular Maintenance**:

   ```bash
   # Weekly cleanup
   cd backend && npm install
   cd frontend && npm install
   cd backend && npx prisma generate
   ```

3. **Development Best Practices**:
   - Save files frequently
   - Don't make too many rapid changes
   - Test after each major change
   - Keep browser dev tools open to monitor network requests

### 🚀 **Quick Recovery Steps**

If everything stops working:

1. **Stop all processes**:

   ```bash
   # Kill all Node processes
   taskkill /IM node.exe /F
   ```

2. **Clean restart**:

   ```bash
   # Use the startup script
   ./start-servers.ps1
   ```

3. **Verify servers**:

   - Backend: http://localhost:5000/api
   - Frontend: http://localhost:5173

4. **Test login**:
   - Use: test@liaadmin.com / password123
   - Check if data loads properly

### 📞 **Still Having Issues?**

1. Check the terminal output for error messages
2. Open browser dev tools (F12) and check Console/Network tabs
3. Verify your .env file has correct DATABASE_URL
4. Make sure PostgreSQL is running (if using local database)

### 🔄 **Server Monitor Usage**

The `server-monitor.js` script automatically restarts crashed servers:

```bash
node server-monitor.js
```

This will:

- Start both servers
- Monitor for crashes
- Auto-restart up to 5 times
- Provide detailed logging
