# Fix Backend Connection Error

## The Problem
You're seeing: "Network error: Cannot connect to backend server"

This means the MongoDB backend server isn't running or isn't accessible.

## Quick Fix (3 Steps)

### Step 1: Create Backend .env File

Create `backend/.env` file with this content:

```env
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

**Or run this command:**
```bash
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
EOF
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ GridFS initialized for file storage
🚀 Server running on port 3000
📍 API Base URL: http://localhost:3000/api
```

## For Physical Device Testing

If you're testing on a **real iPhone** (not simulator), you need to use your computer's IP address:

### Find Your Computer's IP Address

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `inet 192.168.1.100`

### Update API URL

Edit `src/config/mongodb.ts`:

```typescript
export const MONGODB_API_BASE_URL = 'http://192.168.1.100:3000/api'; // Use YOUR IP address
```

**Or set environment variable:**
```bash
export EXPO_PUBLIC_MONGODB_API_URL=http://192.168.1.100:3000/api
```

### Important for Physical Devices:
- ✅ Phone and computer must be on **same Wi-Fi network**
- ✅ Use your computer's IP address, not `localhost`
- ✅ Backend server must be running
- ✅ Make sure firewall allows connections on port 3000

## Test Backend

Open in browser: `http://localhost:3000/api/health`

Should return:
```json
{
  "status": "ok",
  "mongodb": "connected"
}
```

## Quick Start Script

I've created `START_BACKEND.sh` - you can run:

```bash
chmod +x START_BACKEND.sh
./START_BACKEND.sh
```

This will:
- Create .env file
- Install dependencies
- Show your IP address
- Start the backend server

## Troubleshooting

**"Cannot connect" even after starting backend:**
- Check backend is running: Visit `http://localhost:3000/api/health`
- For physical device, make sure you updated IP address in `src/config/mongodb.ts`
- Check phone and computer are on same Wi-Fi

**"MongoDB connection error" in backend:**
- Check `.env` file exists and has correct connection string
- Verify connection string includes `/couples_app` database name
- Check your IP is whitelisted in MongoDB Atlas Network Access

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

Then restart: `npm run dev`

## Next Steps

Once backend is running:
1. ✅ Try uploading images again
2. ✅ Files will be stored in MongoDB GridFS
3. ✅ Check MongoDB Atlas to see uploaded files

