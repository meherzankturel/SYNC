# Real-Time Multimedia Updates - Production Setup

## Overview

This setup enables real-time multimedia updates where:
- ✅ Files upload to MongoDB GridFS (cloud storage)
- ✅ Updates appear on partner's device within 5 seconds
- ✅ No localhost/IP configuration needed
- ✅ Works from anywhere with internet connection

## Architecture

```
User A Uploads → MongoDB API → MongoDB Atlas (GridFS)
                                    ↓
                            Polling/WebSocket
                                    ↓
User B's Device ← Auto-refresh ← MongoDB API
```

## Implementation

### 1. Backend Already Set Up ✅
- MongoDB GridFS for file storage
- REST API endpoints for reviews
- CORS configured for production

### 2. Frontend Real-Time Updates

The `mongodbReview.service.ts` service provides:

**Polling-based Real-Time:**
```typescript
import { startReviewPolling } from '../services/mongodbReview.service';

// Start polling for reviews
const stopPolling = startReviewPolling(
  dateNightId,
  (reviews) => {
    setReviews(reviews); // Update UI
  },
  5000 // Poll every 5 seconds
);

// Cleanup when component unmounts
return () => stopPolling();
```

### 3. Integration with Date Nights Screen

Update `app/(tabs)/date-nights.tsx`:

```typescript
import { startReviewPolling, getReviewsForDateNight } from '../../src/services/mongodbReview.service';

// In your component
useEffect(() => {
  if (!dateNightId) return;
  
  // Start real-time polling
  const stopPolling = startReviewPolling(
    dateNightId,
    (reviews) => {
      setReviews(reviews);
      // Update UI with new reviews/images
    },
    5000 // Poll every 5 seconds
  );
  
  return stopPolling; // Cleanup
}, [dateNightId]);
```

## Production Deployment

### Step 1: Deploy Backend

**Vercel (Recommended):**
```bash
cd backend
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `MONGODB_URI`: Your MongoDB connection string
- `NODE_ENV`: `production`
- `FRONTEND_URL`: Your Expo app URL

### Step 2: Update Frontend Config

**Create `.env` file:**
```
EXPO_PUBLIC_MONGODB_API_URL=https://your-backend.vercel.app/api
```

The code automatically uses this in production builds.

### Step 3: Test Real-Time

1. Partner A uploads images
2. Partner B's device polls every 5 seconds
3. New reviews appear automatically within 5 seconds
4. No manual refresh needed!

## Advanced: WebSocket Support (Optional)

For even faster updates (< 1 second), add WebSocket support:

### Backend (add to `backend/src/index.ts`):
```typescript
import { Server } from 'socket.io';
import http from 'http';

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.on('subscribe-reviews', (dateNightId) => {
    socket.join(`reviews:${dateNightId}`);
  });
});

// Emit when review is created
io.to(`reviews:${dateNightId}`).emit('new-review', review);
```

### Frontend:
```typescript
import { io } from 'socket-client';

const socket = io(MONGODB_API_BASE_URL);

socket.emit('subscribe-reviews', dateNightId);
socket.on('new-review', (review) => {
  setReviews(prev => [review, ...prev]);
});
```

## Benefits

🎯 **Production Ready** - No localhost issues
🎯 **Real-Time** - Updates within 5 seconds
🎯 **Reliable** - Polling works everywhere
🎯 **Scalable** - Cloud infrastructure
🎯 **Simple** - Easy to implement and maintain

## Performance Considerations

**Polling Interval:**
- 5 seconds: Good balance (recommended)
- 3 seconds: Faster updates, more API calls
- 10 seconds: Slower updates, fewer API calls

**Optimizations:**
- Only poll when screen is focused
- Pause polling when app is in background
- Use optimistic updates (show immediately, sync in background)

## Monitoring

Add to backend for production monitoring:

```typescript
// Log upload events
console.log(`[${new Date().toISOString()}] Upload: ${filename} by ${userId}`);

// Add metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    uploads: uploadCount,
    reviews: reviewCount,
    uptime: process.uptime()
  });
});
```

## Future Enhancements

1. **WebSocket Integration** - Sub-second updates
2. **Push Notifications** - Alert partner when review is posted
3. **Optimistic Updates** - Show upload immediately
4. **Offline Support** - Queue uploads when offline
5. **Image Compression** - Optimize before upload

