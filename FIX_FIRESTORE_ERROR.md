# Fix: Firebase Firestore Error

## ✅ What I Fixed

I've added error handlers to all Firestore queries in `app/index.tsx`. This will prevent errors from showing in the UI and log them to the console instead.

## 🔧 Next Steps to Fully Fix

The error you're seeing is likely because:

### 1. Firestore Database Not Created Yet

You need to create the Firestore database in Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your project: **boundless-d2a20**
3. Click **Firestore Database** in the left menu
4. Click **Create database**
5. Choose **Start in test mode** (for now - we'll deploy security rules later)
6. Select a location (choose closest to you)
7. Click **Enable**

### 2. Firestore Security Rules

The current `firestore.rules` file has temporary permissive rules. To deploy them:

```bash
# Make sure you're logged in
npx firebase-tools login

# Deploy the rules
npx firebase-tools deploy --only firestore:rules
```

### 3. Create Firestore Indexes (If Needed)

Some queries might need composite indexes. If you see errors about missing indexes:

1. The error message will include a link to create the index
2. Click the link and it will create the index automatically
3. Or go to Firebase Console → Firestore → Indexes → Create Index

## 🎯 What Changed

All `onSnapshot` calls now have error handlers:
- User profile listener
- Mood queries
- Partner profile listener
- Partner mood queries
- SOS events queries

Errors are now logged to console instead of showing in the UI.

## ✅ Test It

1. **Reload the app** (shake device → Reload)
2. **Check the terminal** for any error messages
3. **Create Firestore database** if you haven't already
4. The error banner should disappear once Firestore is set up

---

**Note:** The app will work even if Firestore isn't set up yet - it will just show empty states. Once you create the database, everything will start working!

