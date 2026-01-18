# Fix Image Upload Instructions

## Issue
Images are failing to upload with error: "Failed to read file"

## Solution

### Step 1: Install expo-file-system
Run this command in your terminal:
```bash
npm install
```
or
```bash
npx expo install expo-file-system
```

### Step 2: Restart Your App
After installing, you MUST restart your Expo app:
1. Stop the current app (Ctrl+C in terminal)
2. Clear cache and restart:
```bash
npm start -- --clear
```
3. Reload the app on your device (press `r` in terminal or shake device and tap "Reload")

### Step 3: Deploy Firebase Storage Rules (if not done)
```bash
firebase deploy --only storage
```

### Step 4: Verify Firebase Storage is Enabled
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Storage" in left sidebar
4. If not enabled, click "Get started" and follow setup

## Why This Fixes It
- `expo-file-system` is required to read local file URIs from `expo-image-picker`
- Without it, the app cannot read the image files from device storage
- The package is already added to `package.json`, just needs to be installed

## Test
After completing the steps:
1. Open the review modal
2. Tap "Add Photos"
3. Select an image
4. Submit the review
5. The image should upload successfully

