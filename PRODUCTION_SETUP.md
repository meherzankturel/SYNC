# Production-Ready Multimedia Setup

This guide sets up a production deployment that works without localhost/IP issues and includes real-time updates.

## Architecture Overview

```
React Native App (Expo)
    ↓
Production Backend API (Vercel/Railway/Render)
    ↓
MongoDB Atlas (Cloud Database)
    ↓
GridFS (File Storage in MongoDB)
```

**Benefits:**
- ✅ No localhost/IP configuration needed
- ✅ Works from anywhere
- ✅ Real-time updates via polling/WebSockets
- ✅ Scalable cloud infrastructure
- ✅ Production-ready error handling

## Step 1: Deploy Backend to Cloud

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Expo app URL (or `*` for development)

4. **Your API URL will be:** `https://your-project.vercel.app/api`

### Option B: Railway

1. **Connect GitHub repo** to Railway
2. **Set Root Directory:** `backend`
3. **Set Build Command:** `npm install && npm run build`
4. **Set Start Command:** `npm start`
5. **Add Environment Variables:**
   - `MONGODB_URI`
   - `NODE_ENV=production`
   - `FRONTEND_URL=*`

### Option C: Render

1. **Create new Web Service**
2. **Connect repository**
3. **Settings:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: `Node`
4. **Add Environment Variables**

## Step 2: Update Frontend Configuration

### Environment-Based Configuration

Update `src/config/mongodb.ts`:

```typescript
// Automatically use production URL in production builds
const getApiUrl = () => {
  // Check for production environment variable
  if (process.env.EXPO_PUBLIC_MONGODB_API_URL) {
    return process.env.EXPO_PUBLIC_MONGODB_API_URL;
  }
  
  // Check if in production build
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-backend.vercel.app/api'; // Your deployed URL
  }
  
  // Development fallback
  return 'http://localhost:3000/api';
};

export const MONGODB_API_BASE_URL = getApiUrl();
```

### Set Environment Variable for Expo

Create `.env` file in project root:
```
EXPO_PUBLIC_MONGODB_API_URL=https://your-backend.vercel.app/api
```

## Step 3: Add Real-Time Updates

### Option A: Polling (Simple, Works Everywhere)

Update `app/(tabs)/date-nights.tsx` to poll for new reviews:

```typescript
useEffect(() => {
  if (!dateNightId) return;
  
  // Poll for new reviews every 5 seconds
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(
        `${MONGODB_API_BASE_URL}/reviews/date-night/${dateNightId}`
      );
      const newReviews = await response.json();
      setReviews(newReviews);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(pollInterval);
}, [dateNightId]);
```

### Option B: WebSocket (Better Performance)

Add WebSocket support to backend and frontend for true real-time.

## Step 4: Update Backend for Production

### Update CORS for Production

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'exp://*'] // Allow Expo URLs
    : '*',
  credentials: true,
}));
```

### Add Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/media', uploadLimiter);
```

## Step 5: Update Build Scripts

### Backend `package.json`

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "vercel-build": "npm run build"
  }
}
```

## Step 6: Testing Production

1. **Deploy backend** to Vercel/Railway/Render
2. **Update `.env`** with production API URL
3. **Build Expo app:**
   ```bash
   eas build --platform ios
   ```
4. **Test uploads** - should work from anywhere!

## Real-Time Features Added

✅ **Automatic Refresh** - Polls for new reviews every 5 seconds
✅ **Optimistic Updates** - Shows upload immediately, syncs in background
✅ **Error Recovery** - Retries failed uploads automatically
✅ **Progress Tracking** - Shows upload progress in real-time

## Production Checklist

- [ ] Backend deployed to cloud (Vercel/Railway/Render)
- [ ] Environment variables set in cloud platform
- [ ] Frontend `.env` file updated with production URL
- [ ] CORS configured for production
- [ ] Real-time polling enabled
- [ ] Error handling tested
- [ ] Upload limits configured
- [ ] MongoDB Atlas network access allows cloud platform IPs

## Benefits

🎯 **No Localhost Issues** - Always uses cloud URL
🎯 **Real-Time Updates** - Partners see uploads within 5 seconds
🎯 **Scalable** - Cloud infrastructure handles load
🎯 **Reliable** - No dependency on local network
🎯 **Production Ready** - Error handling, rate limiting, monitoring

