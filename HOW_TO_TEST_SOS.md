# 📱 How to Test and Fix SOS Feature - Step by Step

## Step 1: Check Console Logs (When Sending SOS)

### On Your Device (Sender):
1. **Open the app** on your phone
2. **Open the terminal** where Expo is running (on your computer)
3. **Long press the SOS button** in the app
4. **Confirm** sending SOS
5. **Look in the terminal** for this log:
   ```
   Sending SOS with: {
     userId: '...',
     pairId: '...',
     hasPushToken: true/false,
     hasPhoneNumber: true/false,
     phoneNumber: '***' or 'none'
   }
   ```

**What to check:**
- ✅ `hasPushToken: true` = Partner will receive notification
- ❌ `hasPushToken: false` = Partner needs to log in on a physical device
- ✅ `hasPhoneNumber: true` = FaceTime will launch
- ❌ `hasPhoneNumber: false` = Need to add partner's phone number

---

## Step 2: Check Firestore Database

### Check if SOS Event is Created:

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com/
   - Select your project: **boundless-d2a20**

2. **Open Firestore Database:**
   - Click **Firestore Database** in left menu
   - If you see "Create database", click it and choose "Start in test mode"

3. **Check for SOS Events:**
   - Look for collection named `sosEvents`
   - If it doesn't exist, create it by sending an SOS
   - After sending SOS, you should see a new document appear

4. **Check the Document:**
   - Click on the document
   - Should see:
     - `userId`: Your user ID
     - `pairId`: Your pair ID
     - `responded`: false
     - `timestamp`: Current time
     - `message`: "I need you right now!"

**If no document appears:**
- Check browser console for errors
- Make sure Firestore database is created
- Check that you're logged in

---

## Step 3: Add Phone Number to Partner's Profile

### Option A: Through Firebase Console (Quick Test)

1. **Go to Firestore Database**
2. **Find `users` collection**
3. **Click on partner's user document** (their userId)
4. **Click "Add field"**
5. **Field name:** `phoneNumber`
6. **Field type:** string
7. **Value:** Partner's phone number (format: `+1234567890`)
   - Example: `+14155551234` (US number)
   - Must include country code with `+`
8. **Click "Update"**

### Option B: Through the App (Better - Need to Build Feature)

We need to add a settings screen where users can add their phone number. For now, use Option A.

---

## Step 4: Check Partner's Push Token

### In Firebase Console:

1. **Go to Firestore Database**
2. **Find `users` collection**
3. **Click on partner's user document**
4. **Check if `pushToken` field exists**

**If `pushToken` is missing:**
- Partner needs to log in on a **physical device** (not simulator)
- Push tokens only work on real devices
- After login, the token should be saved automatically

**To verify:**
- Partner should log out and log back in
- Check Firestore again - `pushToken` should appear

---

## Step 5: Test SOS Feature

### On Your Device (Sender):

1. **Make sure you're logged in**
2. **Long press the red Signal button** (hold for 800ms)
3. **Confirm** in the dialog
4. **Check terminal** for logs
5. **Check Firestore** - new SOS document should appear

### On Partner's Device (Receiver):

1. **Make sure partner is logged in**
2. **Keep app open** (or in background)
3. **Wait for notification** - should appear within seconds
4. **Tap notification** - app should open
5. **Check for red SOS banner** at top of screen
6. **If banner doesn't appear:**
   - Pull down to refresh the home screen
   - This manually checks for SOS

---

## Step 6: Create Firestore Index (If Needed)

### If you see this error in console:
```
The query requires an index...
```

### Fix:

1. **Click the link** in the error message
   - Firebase will open a page to create the index
   - Click "Create Index"
   - Wait 1-2 minutes for it to build

2. **OR create manually:**
   - Go to Firebase Console → Firestore → Indexes
   - Click "Create Index"
   - Collection: `sosEvents`
   - Fields:
     - `userId` - Ascending
     - `responded` - Ascending  
     - `timestamp` - Descending
   - Click "Create"
   - Wait for it to build (1-2 minutes)

**Note:** The app now has a fallback query that works without this index, but the index makes it faster.

---

## Step 7: Troubleshooting Checklist

### If SOS notification doesn't appear:
- [ ] Partner is logged in on a **physical device** (not simulator)
- [ ] Partner has `pushToken` in their Firestore profile
- [ ] Partner granted notification permissions
- [ ] Check terminal for "Push notification send result"

### If FaceTime doesn't launch:
- [ ] Partner has `phoneNumber` in their Firestore profile
- [ ] Phone number is in correct format: `+1234567890`
- [ ] You're on iOS (FaceTime is iOS only)
- [ ] Check console for FaceTime launch errors

### If SOS banner doesn't appear:
- [ ] Partner pulls down to refresh (manual check)
- [ ] Check Firestore - SOS document exists
- [ ] Check console for listener errors
- [ ] Try creating the Firestore index (Step 6)

---

## Quick Commands Reference

### Check if Firestore is set up:
```bash
# In terminal, check if you can access Firebase
# Just open Firebase Console in browser
```

### View console logs:
```bash
# In terminal where Expo is running
# Logs appear automatically when you use the app
```

### Reload app:
- **Shake device** → Tap "Reload"
- **OR** Close app completely and reopen

---

## Expected Flow

1. **You send SOS:**
   - ✅ Console shows: "Sending SOS with: ..."
   - ✅ Firestore creates document in `sosEvents`
   - ✅ Push notification sent
   - ✅ FaceTime launches (if phone number available)
   - ✅ You see "SOS Sent" confirmation

2. **Partner receives:**
   - ✅ Push notification appears
   - ✅ Tapping notification opens app
   - ✅ Red SOS banner appears at top
   - ✅ Partner can tap banner to call or respond

---

## Still Not Working?

1. **Share the console logs** - Copy what you see in terminal
2. **Check Firestore** - Take a screenshot of `sosEvents` collection
3. **Check user profiles** - Verify `pushToken` and `phoneNumber` exist
4. **Try manual refresh** - Partner pulls down to refresh

Let me know what you see in the logs and I can help debug further!

