# How to Find User Document in Firestore

## Method 1: Find by Email (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **boundless-d2a20**
3. Click **Firestore Database** in the left sidebar
4. Click on the **`users`** collection
5. You'll see a list of user documents
6. **Look at the `email` field** in each document to find:
   - `meherzankturel@...` (or whatever email they used)
   - `meherzankhyati@...` (or whatever email they used)

The document ID (the long string) is the user's UID, but you don't need to know it - just find the document by looking at the `email` field.

## Method 2: Get User ID from App Console

1. Open the app on the device where "meherzankturel" is logged in
2. Open the developer console (shake device → "Debug" or check Expo logs)
3. Look for logs that show:
   ```
   ✅ Partner profile loaded: {
     partnerId: "abc123xyz..."  <-- This is the user ID you need
   }
   ```
4. Copy that `partnerId` - that's the user's UID
5. In Firestore, search for that document ID in the `users` collection

## Method 3: Check Authentication Tab

1. Go to Firebase Console
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. You'll see all users with their emails
5. Click on a user to see their **User UID**
6. Copy that UID
7. Go to **Firestore Database** → `users` collection
8. Find the document with that UID as the document ID

## What to Add to the User Document

Once you find the user document for "meherzankturel", click on it and add these fields:

### Option A: Add Phone Number Only
```json
{
  "phoneNumber": "+1234567890"  // Replace with actual phone number
}
```

### Option B: Add FaceTime Contact Only
```json
{
  "faceTimeContact": "meherzankturel@example.com"  // Replace with actual email/phone
}
```

### Option C: Add Both (Recommended)
```json
{
  "phoneNumber": "+1234567890",
  "faceTimeContact": "meherzankturel@example.com"
}
```

## Step-by-Step in Firebase Console

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: boundless-d2a20
3. **Go to Firestore**: Click "Firestore Database" in left sidebar
4. **Open users collection**: Click on `users` in the collections list
5. **Find the user**: 
   - Look through the documents
   - Click on each document to see its fields
   - Find the one with `email: "meherzankturel@..."` (or their actual email)
6. **Edit the document**:
   - Click the "Edit document" button (pencil icon)
   - Click "Add field"
   - Field name: `phoneNumber`
   - Field type: `string`
   - Value: Their phone number (e.g., `"+1234567890"`)
   - Click "Add field" again
   - Field name: `faceTimeContact`
   - Field type: `string`
   - Value: Their FaceTime email or phone (e.g., `"meherzankturel@example.com"`)
   - Click "Update"

## Quick Visual Guide

```
Firebase Console
├── Project: boundless-d2a20
    ├── Firestore Database
        ├── Collections
            ├── users  ← Click here
                ├── [document-id-1]  ← Click to view
                │   ├── email: "meherzankturel@..."
                │   ├── displayName: "..."
                │   └── (add phoneNumber and faceTimeContact here)
                └── [document-id-2]
                    ├── email: "meherzankhyati@..."
                    └── ...
```

## Still Can't Find It?

If you can't find the user document:

1. **Check if the user exists in Authentication**:
   - Go to Authentication → Users
   - If you see the email there, copy the UID
   - Go to Firestore → users → search for that UID

2. **Check console logs in the app**:
   - When SOS fails, check the console
   - Look for: `Partner ID: ...` in the error message
   - That's the user ID you need

3. **Create the document if it doesn't exist**:
   - If the user document doesn't exist, you can create it
   - Document ID: Use the UID from Authentication
   - Add fields: `email`, `phoneNumber`, `faceTimeContact`

