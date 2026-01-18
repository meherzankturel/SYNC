# ✅ Check Partner's Profile - Quick Guide

## What You Have (Current User):
- ✅ Phone Number: `+14374298754`
- ✅ Push Token: `ExponentPushToken[Ou_nw7Pqlcm1rodQE_r5WQ]`
- ✅ Partner ID: `pGlgln37m2M6607XMePc3ZEulio2`

## Next Steps:

### 1. Check Partner's Profile

In Firebase Console:

1. **Click on the `users` collection** (you're already there)
2. **Find the document with ID:** `pGlgln37m2M6607XMePc3ZEulio2`
   - This is your partner's user document
3. **Click on that document**
4. **Check if it has:**
   - ✅ `phoneNumber` field (for FaceTime)
   - ✅ `pushToken` field (for notifications)
   - ✅ `partnerId` field (should point back to your user ID)

**If partner is missing phoneNumber or pushToken:**
- Partner needs to log in on their physical device
- Push token is automatically saved when they log in
- Phone number needs to be added manually (or we can build a settings screen)

### 2. Check SOS Events

1. **Click on `sosEvents` collection** in the left panel
2. **Check if any documents exist:**
   - If you've sent SOS, you should see documents here
   - Each document should have:
     - `userId`: Who sent the SOS
     - `pairId`: The pair ID
     - `responded`: false (if not responded yet)
     - `timestamp`: When it was sent
     - `message`: "I need you right now!"

### 3. Test SOS Now

Since your profile is set up correctly:

1. **On your device:** Long press the SOS button
2. **Confirm** sending SOS
3. **Go back to Firebase Console**
4. **Click `sosEvents` collection**
5. **You should see a new document appear immediately**

### 4. Check Partner's Device

After sending SOS:
- Partner should receive a push notification
- Partner should see a red SOS banner at top of app
- If banner doesn't appear, partner should pull down to refresh

---

## Quick Checklist:

- [ ] Your profile has phoneNumber ✅ (You have it!)
- [ ] Your profile has pushToken ✅ (You have it!)
- [ ] Partner's profile has phoneNumber (Check in Firestore)
- [ ] Partner's profile has pushToken (Check in Firestore)
- [ ] Send SOS and check `sosEvents` collection
- [ ] Partner receives notification
- [ ] Partner sees SOS banner

---

## If Partner's Profile is Missing Data:

### Add Phone Number:
1. Click on partner's user document (`pGlgln37m2M6607XMePc3ZEulio2`)
2. Click "+ Add field"
3. Field name: `phoneNumber`
4. Type: string
5. Value: Partner's phone number (format: `+1234567890`)
6. Click "Update"

### Push Token (Automatic):
- Partner just needs to log in on their physical device
- Token is saved automatically
- If missing, partner should log out and log back in

---

**Your setup looks perfect! Now test sending an SOS and check the `sosEvents` collection to see if it's working.**

