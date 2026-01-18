# Quick Start: Backend API Setup

## 🎯 What You Need

You've provided:
- MongoDB Connection String: `mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/?appName=Cluster0`

## ✅ What's Ready

I've created a complete backend API in the `backend/` folder. Here's how to get it running:

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- Express.js (web server)
- Mongoose (MongoDB driver)
- Multer (file upload handling)
- TypeScript (type safety)

### Step 2: Create Environment File

Create `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

**Important:** Add `/couples_app` before the `?` in the connection string - this is your database name.

### Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ GridFS initialized successfully
🚀 Server running on port 3000
📍 API Base URL: http://localhost:3000/api
```

### Step 4: Test the API

Open in browser or use curl:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "API is running",
  "mongodb": "connected"
}
```

## 📱 Frontend Configuration

The frontend is already configured to use `http://localhost:3000/api` by default.

If you deploy to production, update `src/config/mongodb.ts`:
```typescript
export const MONGODB_API_BASE_URL = 'https://your-deployed-backend.com/api';
```

## 🎉 You're Ready!

1. Backend running on `http://localhost:3000`
2. Frontend will connect automatically
3. Batch uploads will work via MongoDB API
4. Files stored in MongoDB GridFS

## 🐛 Common Issues

**"MongoDB connection error"**
- Check your IP is whitelisted in MongoDB Atlas
- Verify connection string is correct
- Make sure database name is in the URI

**"GridFS not initialized"**
- Wait a moment after server starts
- Check MongoDB connection is successful first

**"Cannot connect to server"**
- Make sure backend is running (`npm run dev`)
- Check port 3000 is not in use
- Verify API URL in frontend config

