# How to Run (React Native / Expo)

## 1. Backend (Firebase)
(Unchanged from Native version)
1. `cd functions`
2. `npm install`
3. `npm run serve`

## 2. Mobile App (Expo)

### Prerequisites
- Node.js
- **Expo Go** app on your iOS/Android device OR Xcode Simulator / Android Studio.

### Setup
1. Navigate to the project root:
   ```bash
   cd CouplesApp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running
1. Start the development server:
   ```bash
   npx expo start
   ```
2. **Scan the QR code** with your phone (using Camera on iOS or Expo Go on Android).
3. OR press `i` to run in the iOS Simulator.

### Troubleshooting Connection Errors

If you see an error like "Could not connect to the server" or "Unknown error":

1. **Stop all running Expo processes:**
   ```bash
   # Kill any running Expo/Metro processes
   pkill -f "expo start"
   pkill -f "metro"
   ```

2. **Clear Expo cache and restart:**
   ```bash
   npx expo start --clear
   ```

3. **Or use the fix script:**
   ```bash
   chmod +x fix-connection.sh
   ./fix-connection.sh
   ```

4. **If still having issues, reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

5. **For iOS Simulator specifically:**
   - Close the simulator completely
   - Run `npx expo start --ios` to launch fresh

6. **If using Expo Go on physical device:**
   - Make sure your phone and computer are on the same WiFi network
   - Try using tunnel mode: `npx expo start --tunnel`
   - Or use LAN mode: `npx expo start --lan`

### Note on Firebase Config
You will need to add your Firebase configuration in `src/config/firebase.ts`.
