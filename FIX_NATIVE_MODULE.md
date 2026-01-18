# Fix PlatformConstants Native Module Error

## The Problem
The error "PlatformConstants could not be found" happens because:
- Your project is still using SDK 50 packages (react-native 0.73.4)
- Expo Go app is SDK 54
- Native modules don't match between JavaScript bundle and native client

## Solution - Run These Commands

### Step 1: Clean Everything
```bash
rm -rf node_modules package-lock.json .expo
```

### Step 2: Increase File Watcher Limit (macOS)
```bash
ulimit -n 4096
```

### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 4: Force Upgrade Expo to SDK 54
```bash
npm install expo@~54.0.0 --legacy-peer-deps
```

### Step 5: Upgrade React Native to 0.76.5 (SDK 54)
```bash
npm install react-native@0.76.5 react@18.3.1 --legacy-peer-deps
```

### Step 6: Fix All Package Versions (Note the double dash!)
```bash
npx expo install --fix -- --legacy-peer-deps
```

### Step 7: Start the App
```bash
npm start
```

## Quick One-Liner

```bash
rm -rf node_modules package-lock.json .expo && ulimit -n 4096 && npm install --legacy-peer-deps && npm install expo@~54.0.0 react-native@0.76.5 react@18.3.1 --legacy-peer-deps && npx expo install --fix -- --legacy-peer-deps && npm start
```

## Or Use the Fix Script

```bash
./fix-native-module-error.sh
```

## Important Notes

1. **Double Dash**: When passing `--legacy-peer-deps` to `expo install`, use `-- --legacy-peer-deps` (note the double dash `--`)

2. **File Watcher**: The `ulimit -n 4096` fixes the "EMFILE: too many open files" error

3. **SDK Match**: After this, your project will be fully on SDK 54, matching Expo Go

4. **Restart**: After fixing, close Expo Go completely and scan the new QR code

