# ⚠️ Install Network Package - Required!

## The Error You're Seeing

The app can't find `@react-native-community/netinfo` because it's not installed yet.

## Quick Fix

**Run this command in your terminal:**

```bash
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp
npx expo install @react-native-community/netinfo
```

**Or if that fails due to permissions:**

```bash
npm install @react-native-community/netinfo
```

## After Installing

1. **Stop the Expo server** (Ctrl+C in terminal)
2. **Restart it:**
   ```bash
   npm start
   ```
3. **Reload the app** on your device (shake → Reload)

## What This Package Does

- Detects internet connectivity
- Used by SOS feature to decide between FaceTime and phone calls
- Required for the smart connectivity-aware SOS system

---

**Once installed, the error will disappear and SOS will work with connectivity checks!** 🚀

