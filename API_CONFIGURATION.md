# API Configuration Fix

## The Issue

The CSP (Content Security Policy) is blocking connections to your backend server because it's trying to connect to `http://172.20.10.4:5000` instead of `http://localhost:5000`.

## Quick Fix

### Option 1: Use localhost (Recommended)

1. Make sure your backend is running on `http://localhost:5000`
2. The API will automatically use `http://localhost:5000/api`
3. No additional configuration needed

### Option 2: Use Environment Variable

1. Create `frontend/.env` file with:
   ```
   VITE_API_URL=http://172.20.10.4:5000/api
   ```
2. Restart your frontend server

### Option 3: Update API Configuration

1. Open `frontend/src/services/api.ts`
2. Change line 5 from:
   ```typescript
   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
   ```
   To:
   ```typescript
   baseURL: 'http://172.20.10.4:5000/api',
   ```

## What I Fixed

- ✅ Updated CSP to allow connections to `172.20.10.4:5000`
- ✅ Made API configuration flexible with environment variables
- ✅ Added support for multiple backend URLs

## Test the Fix

1. Refresh your browser
2. Try to login or register
3. The CSP errors should be gone
4. Authentication should work properly

The application should now work correctly with your backend server!
