# SOS Internet Connectivity Fix

## Problem
The SOS feature was attempting FaceTime calls even when the internet was off, instead of falling back to regular phone calls.

## Root Cause
1. **NetInfo check was too lenient**: The check `networkState.isInternetReachable` could be `null` or `undefined`, which was being treated as "maybe internet" instead of "no internet".

2. **Connectivity test was unreliable**: The fetch request with `mode: 'no-cors'` could succeed even without real internet connectivity.

3. **Multiple call sites**: FaceTime was being launched from two places:
   - `SOSService.triggerSOS()` (when SOS button is long-pressed)
   - `app/index.tsx` SOS banner (when partner taps to respond)

## Solution

### 1. Stricter NetInfo Check
Changed from:
```typescript
const hasInternet = networkState.isConnected && networkState.isInternetReachable;
```

To:
```typescript
const hasInternet = networkState.isConnected === true && networkState.isInternetReachable === true;
```

This ensures we only try FaceTime if internet is **explicitly** confirmed (true), not if it's `null`, `undefined`, or `false`.

### 2. Better Connectivity Test
- Changed from `HEAD` with `no-cors` to `GET` request
- Only confirm internet if response is actually `ok` (status 200-299)
- Start with `confirmedHasInternet = false` and only set to `true` if we can prove internet exists

### 3. Fixed Both Call Sites
- Updated `SOSService.triggerSOS()` with strict checks
- Updated SOS banner in `app/index.tsx` with the same strict checks

## How It Works Now

1. **NetInfo Check**: First checks if NetInfo says internet is available
   - If NO → Skip FaceTime immediately, use phone call
   - If YES → Proceed to connectivity test

2. **Connectivity Test**: If NetInfo says yes, double-check with actual HTTP request
   - If test succeeds → Confirm internet, try FaceTime
   - If test fails → No internet, use phone call

3. **FaceTime Launch**: Only attempted if:
   - `confirmedHasInternet === true` AND
   - `partnerFaceTimeContact` is available

4. **Phone Call Fallback**: Always attempted if:
   - FaceTime failed OR
   - No internet OR
   - No FaceTime contact available

## Testing

To test the fix:

1. **Turn off WiFi and cellular data** on your device
2. **Long-press the SOS button**
3. **Check console logs** - you should see:
   ```
   ❌ NetInfo says NO internet - will use phone call only
   ❌ NO INTERNET CONFIRMED - Skipping FaceTime, using phone call directly
   Regular phone call launched (FaceTime unavailable or no internet)
   ```
4. **Verify** that only a regular phone call is launched (not FaceTime)

## Console Logs to Watch

When SOS is triggered, you'll see detailed logs like:
```
🔍 SOS Network Check (STRICT): {
  isConnected: false,
  isInternetReachable: false,
  type: 'none',
  hasInternet: false,
  confirmedHasInternet: false,
  willTryFaceTime: false,
  ...
}
```

If you see `confirmedHasInternet: false` and `willTryFaceTime: false`, then FaceTime should NOT be attempted.

