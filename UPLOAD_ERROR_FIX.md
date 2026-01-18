# Upload Error Fix - storage/unknown

## Problem
Firebase Storage uploads were failing with `storage/unknown` error and retrying endlessly.

## Solution Applied

### 1. Improved Error Handling
- Added specific handling for `storage/unknown` errors
- Limited retries for unknown errors (only 2 attempts instead of 5)
- Better error messages for users

### 2. MongoDB Configuration
- MongoDB API URL is now empty by default (uses Firebase)
- Only tries MongoDB batch upload if URL is explicitly configured
- Better fallback logic between MongoDB and Firebase

### 3. Firebase Storage Error Handling
- `storage/unknown` errors now fail faster with clear message
- Better error categorization and user-friendly messages
- Reduced retry attempts for configuration errors

## Current Behavior

### If MongoDB API URL is NOT set (default):
- Uses Firebase Storage for all uploads
- Falls back gracefully on errors
- Shows clear error messages

### If MongoDB API URL IS set:
- Tries MongoDB batch upload first
- Falls back to Firebase if MongoDB fails
- Better error messages for both paths

## To Use MongoDB (When Backend is Ready)

1. Start your backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Set the API URL in your environment or code:
   - For simulator: `http://localhost:3000/api`
   - For physical device: `http://YOUR_COMPUTER_IP:3000/api`
   - Update `src/config/mongodb.ts` or set `EXPO_PUBLIC_MONGODB_API_URL`

3. Test upload - it will use MongoDB batch upload

## To Use Firebase Only (Current Default)

- MongoDB API URL is empty by default
- All uploads go through Firebase Storage
- Should work with your existing Firebase setup

## Error Messages Now Show:

- `storage/unknown`: Clear message about Firebase configuration
- `storage/unauthorized`: Permission/Storage rules issue
- `storage/quota-exceeded`: Storage limit reached
- Network errors: Clear timeout/connection messages

## Next Steps

The upload errors should now:
1. Fail faster with clear messages
2. Not retry endlessly
3. Work with Firebase (default)
4. Be ready for MongoDB when backend is running

Try uploading again - you should see better error messages if something fails!

