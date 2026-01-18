# Fix: "Component auth has not been registered yet" Error

## The Problem
This error occurs when Firebase modules aren't fully loaded when the app tries to access them. This is common in React Native/Expo.

## Solutions (Try in Order)

### Solution 1: Full App Restart (Most Common Fix)

1. **Stop the Expo server:**
   - Press `Ctrl+C` in the terminal

2. **Clear all caches:**
   ```bash
   rm -rf node_modules .expo
   npm install
   ```

3. **Restart the app:**
   ```bash
   npm start
   ```

4. **Reload the app on your device:**
   - Shake device → Tap "Reload"
   - Or close Expo Go completely and reopen it

### Solution 2: Check Firebase Version Compatibility

The error might be due to Firebase version. Check if you need to use a specific version:

```bash
# Check current Firebase version
npm list firebase

# If needed, install a specific compatible version
npm install firebase@^9.23.0
```

### Solution 3: Verify Firebase Config

Make sure your Firebase config in `src/config/firebase.ts` is correct:

1. All values are filled in (no placeholders)
2. Config matches your Firebase Console
3. You're using the **Web app** config (not iOS/Android)

### Solution 4: Check Firebase Services are Enabled

In Firebase Console, verify:
- ✅ Authentication is enabled
- ✅ Firestore Database is created
- ✅ Your project is active

### Solution 5: Reinstall Firebase

If nothing else works:

```bash
npm uninstall firebase
npm install firebase@^10.0.0
npm start
```

## Why This Happens

The "Component auth has not been registered yet" error typically means:
- Firebase modules loaded before the app was ready
- Version incompatibility
- Cache issues
- Firebase not properly initialized

## Quick Fix Command

Run this to do a complete reset:

```bash
rm -rf node_modules .expo && npm install && npm start
```

Then reload the app on your device.

## Still Not Working?

If the error persists after a full restart:
1. Check Firebase Console → Make sure your project is active
2. Verify your config values are correct
3. Try creating a new Firebase project and updating the config
4. Check Expo/React Native version compatibility with Firebase

---

**Most of the time, Solution 1 (full restart) fixes this!** 🔄

