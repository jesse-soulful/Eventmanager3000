# How to Start the Application

## Quick Start Guide

You need to run **two servers** simultaneously:
1. **Backend server** (port 3001) - API and authentication
2. **Frontend server** (port 5173) - React application

## Step-by-Step Instructions

### Option 1: Two Terminal Windows (Recommended)

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📝 Environment: development
```

**Keep this terminal open!** The backend must keep running.

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Keep this terminal open too!**

### Option 2: Using Terminal Tabs

Most terminals support tabs:
- **Tab 1**: `cd backend && npm run dev`
- **Tab 2**: `cd frontend && npm run dev`

## Troubleshooting

### Error: `ERR_CONNECTION_REFUSED`
**Cause**: Backend server is not running.

**Solution**: 
1. Open a terminal
2. Run: `cd backend && npm run dev`
3. Wait for "Server running on http://localhost:3001"
4. Refresh your browser

### Error: Port Already in Use
**Cause**: Another process is using port 3001 or 5173.

**Solution**:
```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or for port 5173
lsof -ti:5173 | xargs kill -9
```

### Backend Won't Start
Check for:
1. **Missing dependencies**: Run `npm install` in the backend directory
2. **Database issues**: Ensure `DATABASE_URL` is set (it's in the npm script)
3. **Port conflicts**: Another app might be using port 3001

### Frontend Can't Connect to Backend
1. Verify backend is running: Open http://localhost:3001/health in your browser
2. Check CORS settings if you're using a different port
3. Verify `VITE_API_URL` in frontend `.env` (if set)

## Verification

Once both servers are running:

1. **Backend Health Check**: 
   - Open: http://localhost:3001/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: 
   - Open: http://localhost:5173
   - Should show the login page

3. **Login Test**:
   - Try logging in with your credentials
   - Should no longer see `ERR_CONNECTION_REFUSED`

## Important Notes

- ⚠️ **Both servers must run simultaneously**
- ⚠️ **Keep both terminal windows/tabs open**
- ⚠️ **Backend must start before frontend** (or refresh frontend after backend starts)
- ⚠️ **Don't close the terminal windows** - closing stops the servers

## Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Wait for backend to be ready (see "Server running" message)
3. Start frontend: `cd frontend && npm run dev` (in another terminal)
4. Open browser: http://localhost:5173
5. Develop your features
6. Both servers auto-reload on code changes

