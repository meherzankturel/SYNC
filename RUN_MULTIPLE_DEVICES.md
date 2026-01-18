# Running Expo App on Multiple Devices Simultaneously

## Quick Start

1. **Start the Expo dev server once:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **Connect iOS Simulator:**
   - In the terminal where Expo is running, press `i`
   - This will automatically open the iOS Simulator
   - OR manually open Simulator and the app will connect

3. **Connect Physical Device:**
   - Open the **Expo Go** app on your iPhone
   - Scan the QR code displayed in the terminal
   - OR tap the connection URL shown in the terminal
   - The app will load on your physical device

## Both devices will connect to the same dev server!

You'll see logs from both devices in the same terminal. They'll both hot-reload when you make code changes.

## Tips

- **Make sure both devices are on the same WiFi network** (for physical device)
- **Use Tunnel mode if on different networks:**
  ```bash
   npx expo start --tunnel
  ```

- **Clear cache if needed:**
  ```bash
   npx expo start --clear
  ```

- **iOS Simulator shortcuts:**
  - Press `i` in terminal to open iOS simulator
  - Press `a` to open Android emulator (if you have one)
  - Press `r` to reload
  - Press `m` to toggle menu

## Troubleshooting

- **Physical device not connecting:**
  - Ensure both computer and phone are on the same WiFi
  - Try tunnel mode: `npx expo start --tunnel`
  - Check firewall settings on your Mac

- **Simulator not opening:**
  - Make sure Xcode is installed
  - Try: `npx expo start --ios`
  - Check if Simulator app is installed

- **Both showing different versions:**
  - Reload both: Press `r` in terminal (affects all connected devices)
  - Or reload individually in each app

## Example Terminal Output

When running, you'll see something like:
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press r │ reload app
› Press m │ toggle menu
```

Press `i` for simulator, scan QR code for physical device - both will connect!

