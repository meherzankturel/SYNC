# How to Start Backend Server

## ✅ Step 1: .env File Created!

I've created the `backend/.env` file with your MongoDB connection string.

## 🚀 Step 2: Start the Backend

Open a **new terminal window** and run:

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

## 📱 Step 3: If Testing on Physical iPhone

Since you're seeing the error about IP address, you're likely testing on a **real iPhone**.

### Find Your Computer's IP Address

Open Terminal and run:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or on Mac, you can find it in:
**System Preferences > Network** (look for your Wi-Fi IP address)

You'll see something like: `192.168.1.100` or `10.0.0.5`

### Update the API URL

Edit `src/config/mongodb.ts` and change:

```typescript
export const MONGODB_API_BASE_URL = 'http://YOUR_IP_HERE:3000/api';
```

For example, if your IP is `192.168.1.100`:
```typescript
export const MONGODB_API_BASE_URL = 'http://192.168.1.100:3000/api';
```

### Important:
- ✅ Backend must be running
- ✅ Phone and computer must be on **same Wi-Fi network**
- ✅ Use your computer's IP, not `localhost`

## 🧪 Step 4: Test Backend

Once backend is running, open in browser:
```
http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "mongodb": "connected"
}
```

## ✅ Step 5: Try Upload Again

Once backend is running and API URL is updated:
1. Restart your Expo app (reload)
2. Try uploading images again
3. Files will be stored in MongoDB GridFS! 🎉

## 🐛 Troubleshooting

**"Cannot connect" error persists:**
- Make sure backend is actually running (check terminal)
- Verify backend shows: "Server running on port 3000"
- Test `http://localhost:3000/api/health` in browser

**"MongoDB connection error" in backend:**
- Check `.env` file exists in `backend/` folder
- Verify connection string includes `/couples_app`
- Check MongoDB Atlas Network Access allows your IP

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```
Then restart: `npm run dev`

