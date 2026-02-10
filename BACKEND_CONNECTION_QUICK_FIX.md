# ⚡ BACKEND CONNECTION QUICK FIX

**Error:** `ERR_CONNECTION_REFUSED`  
**Solution:** Start the backend server

---

## 🎯 INSTANT FIX

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Verify It's Running
```bash
curl http://localhost:5001/health
```

**Expected:** Status 200 with JSON response

---

## 🔍 QUICK DIAGNOSIS

### Is Backend Running?

**Check 1: Look for this in terminal:**
```
=== SERVER STARTED SUCCESSFULLY ===
🚀 Server running on port 5001
```

**Check 2: Test health endpoint:**
```bash
curl http://localhost:5001/health
```

**Check 3: Check port:**
```bash
netstat -ano | findstr :5001
```

---

## 🚨 COMMON PROBLEMS

### Problem 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Fix:**
```bash
# Find process
netstat -ano | findstr :5001

# Kill it
taskkill /PID <PID> /F

# Restart
npm run dev
```

### Problem 2: TypeScript Errors

**Error:**
```
TSError: ⨯ Unable to compile TypeScript
```

**Fix:**
- Check terminal for specific error
- Fix the TypeScript error
- Server will auto-restart

### Problem 3: MongoDB Connection Failed

**Error:**
```
MongooseError: Could not connect
```

**Fix:**
- Check `.env` has `MONGODB_URI`
- Verify IP whitelist in MongoDB Atlas
- Check internet connection

---

## ✅ VERIFICATION

### Test 1: Health Check
```bash
curl http://localhost:5001/health
```

**Expected:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-10T...",
  "uptime": 39.47,
  "port": 5001,
  "services": {
    "database": "connected",
    "server": "running"
  }
}
```

### Test 2: API Health
```bash
curl http://localhost:5001/api/health
```

**Expected:** Detailed service status

### Test 3: From Browser
```javascript
// Open browser console (F12)
fetch('http://localhost:5001/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Health check object logged

---

## 📊 SERVER STATUS

### ✅ Running
```
=== SERVER STARTED SUCCESSFULLY ===
🚀 Server running on port 5001
✅ Mongoose connected to MongoDB
```

### ❌ Not Running
```
# No output
# OR
[nodemon] app crashed
```

### ⚠️ Running with Issues
```
⚠️ Redis not available
⚠️ Cloudinary initialization failed
# Still works but limited features
```

---

## 🔧 RESTART COMMANDS

### Normal Restart
```bash
cd backend
npm run dev
```

### Force Restart
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Start fresh
cd backend
npm run dev
```

### Check Logs
```bash
# Watch logs
tail -f backend/logs/combined.log

# Check errors
tail -f backend/logs/error.log
```

---

## 🎓 PREVENTION

### 1. Always Check Before Testing
```bash
curl http://localhost:5001/health
```

### 2. Keep Terminal Open
- Don't close backend terminal
- Watch for errors
- See startup logs

### 3. Use Nodemon
- Auto-restarts on file changes
- Already configured in `npm run dev`

---

## 📞 STILL NOT WORKING?

### Check These:

1. **Backend terminal open?**
   - Look for "SERVER STARTED SUCCESSFULLY"

2. **Port 5001 free?**
   ```bash
   netstat -ano | findstr :5001
   ```

3. **MongoDB connected?**
   - Check `.env` has `MONGODB_URI`

4. **Frontend using correct URL?**
   - Should be `http://localhost:5001`

5. **Firewall blocking?**
   - Allow Node.js in firewall

---

## 📚 MORE INFO

- **Full Guide:** `CONNECTION_REFUSED_FIX.md`
- **Validation Errors:** `VALIDATION_ERROR_QUICK_FIX.md`
- **Debugging:** `DEBUGGING_FIXES_APPLIED.md`

---

**Status:** ✅ FIXED  
**Backend running on port 5001!** 🚀
