# 🔧 SOS Feature Troubleshooting Guide

## Current Issue: Notification Works But Nothing Else Happens

### What Should Happen:
1. ✅ Push notification sent to partner (WORKING)
2. ❌ SOS banner appears on partner's device (NOT WORKING)
3. ❌ FaceTime launches automatically (MAYBE NOT WORKING)
4. ❌ Partner can see and respond to SOS (NOT WORKING)

## 🔍 Diagnosis Steps

### 1. Check Firestore SOS Event Creation
**Problem**: SOS event might not be created in Firestore

**Check**:
- Open Firebase Console → Firestore Database
- Look for `sosEvents` collection
- Check if new documents are created when you send SOS

**Fix**: If no documents appear:
- Check browser console for errors
- Verify Firestore database is created
- Check Firestore security rules allow writes

### 2. Check Firestore Indexes
**Problem**: SOS query requires composite index

**Check**:
- When you send SOS, check terminal/console for error about missing index
- Error will say: "The query requires an index"

**Fix**:
1. Click the link in the error message (Firebase will create it automatically)
2. OR manually create in Firebase Console:
   - Go to Firestore → Indexes
   - Create composite index:
     - Collection: `sosEvents`
     - Fields: `userId` (Ascending), `responded` (Ascending), `timestamp` (Descending)

### 3. Check Real-Time Listener
**Problem**: Partner's device might not be listening for SOS events

**Check**:
- Partner should see SOS banner when you send SOS
- If banner doesn't appear, listener might be failing

**Fix**:
- Pull down to refresh on partner's device
- Check console for listener errors
- The app now has a fallback query that works without indexes

### 4. Check Phone Number
**Problem**: FaceTime won't launch if phone number is missing

**Check**:
- Partner's profile should have `phoneNumber` field
- Check in Firebase Console → Firestore → `users` collection

**Fix**:
- Partner needs to add phone number to their profile
- Format: `+1234567890` (international format)
- Or use email for FaceTime: `partner@email.com`

### 5. Check Push Token
**Problem**: Notification might not be received if push token is missing

**Check**:
- Partner's profile should have `pushToken` field
- Check in Firebase Console → Firestore → `users` collection

**Fix**:
- Partner needs to log in on a physical device (not simulator)
- Push tokens only work on real devices
- Check that notification permissions are granted

## 🚀 Quick Fixes

### Fix 1: Create Firestore Index
```bash
# When you see the index error, click the link in the error message
# OR create manually in Firebase Console
```

### Fix 2: Add Phone Number to Profile
```typescript
// In your app, add this to user profile:
await updateDoc(doc(db, 'users', userId), {
  phoneNumber: '+1234567890' // Partner's phone number
});
```

### Fix 3: Manual Refresh
- Partner should pull down to refresh the home screen
- This will check for SOS events even if listener fails

### Fix 4: Check Console Logs
- Look for these logs when sending SOS:
  - "Sending SOS with: ..." - Shows what data is being sent
  - "Push notification send result: ..." - Shows if notification was sent
  - Any error messages

## 📱 Testing Checklist

- [ ] Firestore database is created
- [ ] `sosEvents` collection exists
- [ ] Composite index is created (or fallback query works)
- [ ] Partner has `pushToken` in their profile
- [ ] Partner has `phoneNumber` in their profile (for FaceTime)
- [ ] Partner is logged in on a physical device
- [ ] Notification permissions are granted
- [ ] App is open or in background (not force-closed)

## 🔧 What I Just Fixed

1. **Added fallback query** - Works without composite index
2. **Added notification listeners** - App responds when notification is tapped
3. **Added manual refresh check** - Pull down refreshes SOS status
4. **Improved logging** - Shows what data is being sent
5. **Better error handling** - More informative error messages

## 🎯 Next Steps

1. **Reload both devices** - Close and reopen the app
2. **Send SOS again** - Long press the button
3. **Check console logs** - See what's happening
4. **Check Firestore** - Verify SOS event is created
5. **Check partner's device** - Should see banner or notification

## 💡 Expected Behavior

**When you send SOS:**
1. Console shows: "Sending SOS with: {userId, pairId, hasPushToken, hasPhoneNumber}"
2. Firestore creates document in `sosEvents` collection
3. Push notification sent to partner
4. FaceTime launches (if phone number available)
5. Local notification shows "SOS Sent"

**When partner receives SOS:**
1. Push notification appears
2. If app is open: SOS banner appears at top
3. If app is closed: Tapping notification opens app and shows banner
4. Partner can tap banner to call or mark as responded

---

**If still not working**, check the console logs and share the error messages!

