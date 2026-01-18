# Complete MongoDB Atlas Setup Guide

## ✅ What's Been Created

I've created a complete backend API for your MongoDB Atlas integration:

### Backend Structure
```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── models/
│   │   ├── Media.model.ts    # Media file model
│   │   └── Review.model.ts   # Review model
│   ├── routes/
│   │   ├── media.routes.ts   # Media upload endpoints
│   │   ├── auth.routes.ts    # Auth endpoints (placeholder)
│   │   └── review.routes.ts  # Review endpoints
│   └── utils/
│       ├── gridfs.ts         # MongoDB GridFS for file storage
│       └── fileUpload.ts     # Multer configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

### Step 3: Start Backend Server

**Development:**
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Step 4: Update Frontend Configuration

The frontend is already configured to use `http://localhost:3000/api` by default.

If you deploy the backend to production, update `src/config/mongodb.ts`:
```typescript
export const MONGODB_API_BASE_URL = 'https://your-deployed-backend.com/api';
```

## 📡 API Endpoints Available

### Media Upload (Batch)
- **POST** `/api/media/upload-multiple`
  - Upload multiple images/videos at once
  - Body: FormData with `files[]` array
  - Returns: `{ urls: string[] }`

### File Serving
- **GET** `/api/media/file/:fileId`
  - Serve uploaded files from MongoDB GridFS

### Reviews
- **POST** `/api/reviews` - Create review
- **GET** `/api/reviews/date-night/:dateNightId` - Get reviews
- **PUT** `/api/reviews/:id` - Update review
- **DELETE** `/api/reviews/:id` - Delete review

### Health Check
- **GET** `/api/health` - Check API status

## 🎯 Features Implemented

### ✅ Batch File Upload
- Upload multiple images/videos together
- Progress tracking
- Error handling

### ✅ MongoDB GridFS Storage
- Files stored directly in MongoDB
- No need for separate storage service
- Efficient for large files

### ✅ Enhanced Media Viewer
- Next/Previous navigation
- Save to Downloads
- Full-screen viewing

## 🧪 Testing

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   npm start
   ```

3. **Test upload:**
   - Open app
   - Create/update a date review
   - Select multiple photos
   - Upload should work with batch processing

## 📝 Next Steps

1. **Complete MongoDB Setup:**
   - Finish the MongoDB Atlas modal
   - Create the database user
   - Copy the connection string (already have it!)

2. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Test Connection:**
   - Visit: `http://localhost:3000/api/health`
   - Should see: `{ status: 'ok', mongodb: 'connected' }`

4. **Test File Upload:**
   - Upload images in the app
   - Check console for upload progress
   - Verify files appear in MongoDB Atlas

## 🐛 Troubleshooting

### Backend won't start?
- Check MongoDB connection string is correct
- Ensure database name is added: `...mongodb.net/couples_app?...`
- Check if port 3000 is available

### Files not uploading?
- Verify backend is running
- Check console for errors
- Verify API URL is correct in `src/config/mongodb.ts`

### Files not displaying?
- Check if file serving endpoint works: `http://localhost:3000/api/media/file/[fileId]`
- Verify GridFS is initialized

## 📦 Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `cd backend && vercel`
3. Set environment variables in Vercel dashboard
4. Update frontend API URL

### Option 2: Railway
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically
4. Update frontend API URL

### Option 3: Render
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

