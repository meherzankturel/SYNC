# 🚀 Set Up MongoDB Backend NOW

## Quick Setup (3 Steps)

### Step 1: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ GridFS initialized for file storage
🚀 Server running on port 3000
📍 API Base URL: http://localhost:3000/api
```

### Step 2: Create Backend .env File

Create `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

**Important:** Make sure to add `/couples_app` as the database name in the connection string!

### Step 3: Test the Backend

Open in browser: `http://localhost:3000/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "API is running",
  "mongodb": "connected"
}
```

## ✅ What's Changed

- **MongoDB is now the PRIMARY storage method** (not Firebase)
- All files will upload to MongoDB GridFS
- No Firebase fallback - MongoDB is required
- Better error messages if backend isn't running

## 🔧 For Physical Device Testing

If testing on a physical iPhone (not simulator):

1. Find your computer's IP address:
   ```bash
   # macOS
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `src/config/mongodb.ts`:
   ```typescript
   export const MONGODB_API_BASE_URL = 'http://YOUR_IP:3000/api';
   // Example: 'http://192.168.1.100:3000/api'
   ```

3. Make sure phone and computer are on same Wi-Fi network

## 🎯 Ready to Test!

Once backend is running:
1. ✅ Files will upload to MongoDB GridFS
2. ✅ Stored in MongoDB Atlas database
3. ✅ Accessible via API endpoints
4. ✅ No Firebase needed!

## 🐛 Troubleshooting

**"Cannot connect to backend"**
- Make sure backend is running: `cd backend && npm run dev`
- Check URL is correct in `src/config/mongodb.ts`
- For physical device, use IP address not localhost

**"MongoDB connection error"**
- Check `.env` file exists in `backend/` folder
- Verify connection string has database name: `/couples_app`
- Check your IP is whitelisted in MongoDB Atlas

**"GridFS not initialized"**
- Wait a moment after server starts
- Check MongoDB connection is successful first

