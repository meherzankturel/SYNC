# Fix: "Component auth has not been registered yet" Error

## 🔴 The Problem
This error occurs when Firebase modules aren't fully loaded when the app tries to access them. This is common in React Native/Expo.

## ✅ Solution: Complete App Restart

### Step 1: Stop Everything
1. In your terminal, press `Ctrl+C` to stop Expo
2. Close Expo Go app completely on your phone (swipe it away)

### Step 2: Clear All Caches
Run these commands in your terminal:

```bash
# Navigate to project
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp

# Clear Expo cache
rm -rf .expo

# Clear node modules (optional but recommended)
rm -rf node_modules

# Reinstall dependencies
npm install
```

### Step 3: Restart Fresh
```bash
npm start
```

### Step 4: Reload App
1. Open Expo Go on your phone
2. Scan the NEW QR code
3. The app should load without the error

---

## 🚀 Quick One-Liner Fix

Run this single command:

```bash
rm -rf .expo node_modules && npm install && npm start
```

Then reload the app on your device.

---

## 🔍 Why This Happens

The error "Component auth has not been registered yet" means:
- Firebase modules loaded before the app was ready
- Cache contains stale Firebase initialization
- Module loading order issue in React Native/Expo

A complete restart with cache clear fixes this 99% of the time.

---

## ⚠️ If Error Persists

If the error still appears after a full restart:

### Option 1: Check Firebase Version
```bash
npm list firebase
```

If you see version issues, try:
```bash
npm install firebase@^9.23.0
```

### Option 2: Verify Firebase Config
Make sure `src/config/firebase.ts` has:
- ✅ All config values filled in (no placeholders)
- ✅ Correct project ID
- ✅ Valid API keys

### Option 3: Check Firebase Console
1. Go to https://console.firebase.google.com/
2. Verify your project is active
3. Check that Authentication is enabled
4. Check that Firestore is created

---

## ✅ Success Indicators

You'll know it's fixed when:
- ✅ App loads without errors
- ✅ No red error screen
- ✅ You can navigate to login/signup screens
- ✅ No "Component not registered" errors in console

---

## 📝 After Fix

Once the error is gone:
1. Test signing up a user
2. Check Firebase Console → Authentication to see the user
3. Continue building your app!

---

**The fix is almost always: `rm -rf .expo && npm start` + reload app!** 🔄

