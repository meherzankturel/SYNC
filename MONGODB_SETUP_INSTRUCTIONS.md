# MongoDB Atlas Integration - Setup Instructions

## ✅ What Has Been Implemented

### 1. MongoDB Atlas API Configuration
- **File**: `src/config/mongodb.ts`
- Created API service configuration
- Supports batch media uploads
- Includes all necessary endpoints

### 2. Enhanced Media Upload (Batch Support)
- **File**: `src/components/DateReviewModal.tsx`
- ✅ Supports uploading multiple images/videos simultaneously
- ✅ Uses MongoDB batch upload API when configured
- ✅ Falls back to Firebase individual uploads if MongoDB API not available
- ✅ Shows progress for batch uploads
- ✅ Handles errors gracefully (continues with successful uploads)

### 3. Enhanced Media Viewer
- **File**: `src/components/MediaPreviewModal.tsx`
- ✅ Next/Previous navigation buttons
- ✅ Save to Downloads functionality
- ✅ Close button
- ✅ Image counter (e.g., "1 / 5")
- ✅ Works with both images and videos

## 📋 Setup Steps

### Step 1: Install Required Packages

Run these commands in your terminal:

```bash
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp
npx expo install expo-media-library expo-sharing
```

Or if that doesn't work:
```bash
npm install expo-media-library expo-sharing
```

### Step 2: Configure MongoDB Atlas API URL

**Option A: Using Environment Variable (Recommended)**

1. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

2. Add your MongoDB Atlas API URL:
   ```
   EXPO_PUBLIC_MONGODB_API_URL=https://your-api-endpoint.com/api
   ```

3. Install dotenv (if not already installed):
   ```bash
   npm install dotenv
   ```

**Option B: Direct Configuration**

1. Open `src/config/mongodb.ts`
2. Find this line:
   ```typescript
   export const MONGODB_API_BASE_URL = process.env.EXPO_PUBLIC_MONGODB_API_URL || '';
   ```
3. Replace with your API URL:
   ```typescript
   export const MONGODB_API_BASE_URL = 'https://your-api-endpoint.com/api';
   ```

### Step 3: Provide Your MongoDB Atlas API Endpoint

Please provide your MongoDB Atlas API endpoint URL. It should look like:
- `https://your-backend.vercel.app/api`
- `https://your-backend.herokuapp.com/api`
- `https://api.yourdomain.com/api`

Once you provide the URL, I'll update the configuration.

## 🔧 Backend API Requirements

Your MongoDB Atlas backend needs to implement:

### Media Upload Endpoint
**POST** `/media/upload-multiple`

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with multiple files (key: `files[]`)

**Response:**
```json
{
  "urls": [
    "https://storage-url.com/image1.jpg",
    "https://storage-url.com/image2.jpg"
  ]
}
```

Or:
```json
{
  "data": {
    "urls": [
      "https://storage-url.com/image1.jpg",
      "https://storage-url.com/image2.jpg"
    ]
  }
}
```

## 🎯 Features Implemented

### Batch Upload
- Uploads multiple images/videos together
- Shows progress bar during upload
- Handles errors gracefully
- Continues with successful uploads even if some fail

### Enhanced Media Viewer
- **Navigation**: Swipe or use Previous/Next buttons
- **Save to Downloads**: Download button in header (images only)
- **Close**: X button in top-left
- **Counter**: Shows current position (e.g., "2 / 5")
- **Full Screen**: Immersive viewing experience

## 📱 How to Use

### Uploading Multiple Media Files

1. Open a date review
2. Click "Add Photos" or "Add Videos"
3. Select multiple files from your gallery
4. All files will be uploaded together (batch upload)
5. Progress bar shows upload status

### Viewing Media

1. After upload, click on any image/video thumbnail
2. Media viewer opens in full screen
3. Use:
   - **Swipe left/right** or **Previous/Next buttons** to navigate
   - **Download button** (top-right) to save image to photo library
   - **Close button** (top-left) to exit viewer

## ⚠️ Important Notes

1. **MongoDB API is optional**: The app will work with Firebase if MongoDB API is not configured
2. **Batch upload requires MongoDB API**: If not configured, files upload individually (slower)
3. **Save to Downloads**: Requires photo library permissions (requested automatically)
4. **Video saving**: Currently only images can be saved (videos require additional setup)

## 🐛 Troubleshooting

### Batch upload not working?
- Check if `MONGODB_API_BASE_URL` is set correctly
- Verify your backend API is running and accessible
- Check console logs for error messages

### Save to Downloads not working?
- Grant photo library permissions when prompted
- Check device settings: Settings → Privacy → Photos → Your App

### Images not displaying?
- Check network connection
- Verify image URLs are accessible
- Check console logs for loading errors

## 📝 Next Steps

1. **Provide your MongoDB Atlas API URL** - I'll update the configuration
2. **Test batch uploads** - Try uploading multiple images at once
3. **Test media viewer** - Click on uploaded images to test navigation and save functionality

