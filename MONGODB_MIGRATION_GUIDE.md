# MongoDB Atlas Migration Guide

## Overview
This guide explains how to migrate from Firebase to MongoDB Atlas for the Couples App.

## Step 1: Configure MongoDB API

1. **Get your MongoDB Atlas API endpoint** from your backend provider
2. **Update the API URL** in one of these ways:

   **Option A: Environment Variable (Recommended)**
   - Create a `.env` file in the project root:
     ```
     EXPO_PUBLIC_MONGODB_API_URL=https://your-api-endpoint.com/api
     ```
   - Install dotenv: `npm install dotenv`
   - The app will automatically use this URL

   **Option B: Direct Configuration**
   - Open `src/config/mongodb.ts`
   - Update the `MONGODB_API_BASE_URL` constant:
     ```typescript
     export const MONGODB_API_BASE_URL = 'https://your-api-endpoint.com/api';
     ```

## Step 2: Backend API Requirements

Your MongoDB Atlas backend API should implement these endpoints:

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/reset-password` - Password reset

### Media Upload
- `POST /media/upload-multiple` - Upload multiple files
  - Accepts: FormData with multiple files
  - Returns: Array of file URLs
  - Should handle: images and videos

### Date Reviews
- `POST /reviews` - Create review
- `GET /reviews/date-night/:dateNightId` - Get reviews for date night
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Other Endpoints
See `src/config/mongodb.ts` for the complete list of required endpoints.

## Step 3: Update Services

The services will need to be updated to use the MongoDB API instead of Firebase. This is a work in progress.

## Step 4: Test the Migration

1. Start the app: `npm start`
2. Test authentication
3. Test media uploads
4. Test date reviews
5. Verify data is stored in MongoDB Atlas

## Notes

- The Firebase code is still present but will be gradually replaced
- Both systems can coexist during migration
- Make sure your backend handles CORS for React Native requests
- Implement proper authentication token storage

