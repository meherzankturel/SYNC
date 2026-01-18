# Quick Fix for Expo Connection Error

## Immediate Solution

The error "Could not connect to the server" means the Expo dev server isn't running or there's a stale connection.

### Step 1: Stop Everything
Close the Expo Go app on your phone completely (swipe it away from recent apps).

### Step 2: Restart the Server
Run this command in your terminal:

```bash
npx expo start --clear
```

This will:
- Clear the cache
- Start a fresh dev server
- Show you a new QR code

### Step 3: Reconnect
1. **On your phone**: Open the Camera app (iOS) or Expo Go app
2. **Scan the NEW QR code** that appears in your terminal
3. The app should connect successfully

## Alternative: If Still Not Working

### Option A: Use Tunnel Mode
```bash
npx expo start --tunnel --clear
```
This uses Expo's servers to bridge the connection (works even if WiFi is different).

### Option B: Full Reset
```bash
npm run reset
npx expo start --clear
```

### Option C: For iOS Simulator
```bash
npx expo start --ios --clear
```
This will automatically launch in the iOS Simulator.

## Common Issues

1. **Phone and computer on different networks**: Use `--tunnel` flag
2. **Firewall blocking connection**: Check your Mac's firewall settings
3. **Port 8081 already in use**: Kill the process using that port
4. **Stale cache**: Always use `--clear` flag when restarting

## Network Troubleshooting

If you see `exp://192.168.2.70:8081` but it can't connect:

1. Make sure your Mac and iPhone are on the **same WiFi network**
2. Check your Mac's IP address: `ifconfig | grep "inet "`
3. If IP changed, restart Expo with `--clear`
4. Try tunnel mode: `npx expo start --tunnel --clear`

