# Backend API Template for MongoDB Atlas

## Quick Setup Guide

### 1. Create Backend Project

```bash
mkdir couples-app-backend
cd couples-app-backend
npm init -y
npm install express mongoose multer cors dotenv
npm install -D nodemon typescript @types/express @types/node
```

### 2. Basic Server Structure

**server.js** (or **index.js**):
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI; // Your connection string
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Media Upload Endpoint (Multiple Files)
app.post('/api/media/upload-multiple', upload.array('files'), async (req, res) => {
  try {
    // Handle file uploads here
    // Upload to cloud storage (AWS S3, Cloudinary, etc.)
    // Return URLs
    const urls = []; // Array of uploaded file URLs
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Environment Variables (.env)

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
PORT=3000
```

### 4. Deploy to Vercel/Railway

See deployment instructions in the full guide.

