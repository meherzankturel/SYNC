# Couples App Backend API

Backend API for the Couples App using MongoDB Atlas and Express.js.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

### 3. Build and Run

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

### Media Upload
- `POST /api/media/upload-multiple` - Upload multiple files (batch)
  - Body: FormData with `files[]` array
  - Returns: Array of file URLs
- `GET /api/media/file/:fileId` - Serve uploaded files

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/date-night/:dateNightId` - Get reviews for date night
- `GET /api/reviews/:id` - Get single review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Health Check
- `GET /api/health` - Check API status

## File Storage

Files are stored in MongoDB GridFS, which is perfect for storing large files directly in MongoDB.

## Deployment

### Option 1: Local Development
Run `npm run dev` and access at `http://localhost:3000`

### Option 2: Deploy to Vercel/Railway/Render
See deployment instructions below.

