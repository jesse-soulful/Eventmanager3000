# 🚀 Quick Start Guide

## The Problem
You're seeing `ERR_CONNECTION_REFUSED` because **the backend server is not running**.

## The Solution

### Step 1: Open a Terminal
Open a **new terminal window** (don't close your frontend terminal if it's running).

### Step 2: Start the Backend Server

**Option A: Using the start script (easiest)**
```bash
cd backend
./start.sh
```

**Option B: Using npm directly**
```bash
cd backend
npm run dev
```

### Step 3: Wait for Server to Start
You should see:
```
🚀 Server running on http://localhost:3001
📝 Environment: development
```

### Step 4: Refresh Your Browser
Once you see "Server running", refresh your browser and try logging in again.

## ⚠️ Important

- **Keep the backend terminal open** - Closing it stops the server
- **Run backend and frontend in separate terminals**
- **Backend must be running before frontend can connect**

## Still Not Working?

1. **Check if port 3001 is already in use:**
   ```bash
   lsof -i :3001
   ```
   If something is using it, kill it:
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Check for errors in the backend terminal** - Share any error messages you see

3. **Verify the database exists:**
   ```bash
   cd backend
   ls -la prisma/dev.db
   ```
   If it doesn't exist, the server will create it automatically.

## Need Help?

Share the output from your backend terminal when you run `npm run dev` - that will show any errors preventing the server from starting.

