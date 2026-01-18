# 🧠 Smart SOS Contact System - Implementation Guide

## ✅ What's Been Implemented

The SOS feature now uses **two separate contact fields** for maximum reliability:

1. **`faceTimeContact`** - Email or phone number for FaceTime (primary)
2. **`phoneNumber`** - Regular phone number for fallback calls (backup)

## 🎯 How It Works

### Smart Flow:
```
1. Try FaceTime with faceTimeContact (email or number)
   ↓ (if fails)
2. Fallback to regular phone call with phoneNumber
   ↓ (if both fail)
3. SOS notification still sent (most important!)
```

## 📝 Firestore Structure

### User Profile Fields:

```javascript
{
  email: "user@email.com",
  faceTimeContact: "partner@email.com",  // NEW: For FaceTime
  phoneNumber: "+1234567890",            // NEW: For regular calls
  pushToken: "ExponentPushToken[...]",
  partnerId: "...",
  // ... other fields
}
```

## 🔧 How to Set Up in Firebase

### For Each User:

1. **Go to Firestore → `users` collection**
2. **Click on user's document**
3. **Add these fields:**

#### Field 1: `faceTimeContact`
- **Type:** string
- **Value:** 
  - Partner's email (if they use FaceTime with email) - **RECOMMENDED**
  - OR phone number registered for FaceTime
- **Example:** `partner@email.com` or `+1234567890`

#### Field 2: `phoneNumber`
- **Type:** string
- **Value:** Partner's regular phone number (for calls)
- **Format:** `+1234567890` (with country code)
- **Example:** `+14374298754`

### Example Setup:

**User 1:**
```javascript
{
  email: "meherzankhyati@gmail.com",
  faceTimeContact: "partner@email.com",  // Partner's FaceTime email
  phoneNumber: "+14374298754",            // Partner's phone for calls
  partnerId: "pGlgln37m2M6607XMePc3ZEulio2"
}
```

**User 2 (Partner):**
```javascript
{
  email: "partner@email.com",
  faceTimeContact: "meherzankhyati@gmail.com",  // Your FaceTime email
  phoneNumber: "+19876543210",                   // Your phone for calls
  partnerId: "GgC6TmD8j7R2snSylmeqknyeriA3"
}
```

## 🚀 Benefits

1. **Reliability:** If FaceTime fails, automatically tries phone call
2. **Flexibility:** Can use email for FaceTime (more reliable)
3. **Smart Fallback:** Never fails completely - always tries backup
4. **User Choice:** Users can set different contacts for FaceTime vs calls

## 📱 What Happens When SOS is Sent

### Scenario 1: FaceTime Works
1. ✅ FaceTime launches with `faceTimeContact`
2. ✅ Partner receives notification
3. ✅ Call connects

### Scenario 2: FaceTime Fails (Number Not Registered)
1. ❌ FaceTime tries with `faceTimeContact` → Fails
2. ✅ **Automatically falls back** to regular phone call with `phoneNumber`
3. ✅ Partner receives notification
4. ✅ Regular call connects

### Scenario 3: Both Available
1. ✅ FaceTime launches first (preferred)
2. ✅ If FaceTime fails, phone call launches automatically
3. ✅ Partner always reachable

## 🔍 Code Logic

```typescript
// 1. Try FaceTime first
if (partnerFaceTimeContact) {
  try {
    await launchFaceTime(partnerFaceTimeContact);
    // Success!
  } catch {
    // FaceTime failed, continue to phone call
  }
}

// 2. Fallback to phone call
if (!faceTimeLaunched && partnerPhoneNumber) {
  await launchPhoneCall(partnerPhoneNumber);
  // Always works if number is valid
}
```

## 💡 Recommendations

### Best Setup:
- **`faceTimeContact`:** Use partner's **email address**
  - More reliable
  - Works across devices
  - Doesn't depend on phone number registration

- **`phoneNumber`:** Use partner's **regular phone number**
  - For fallback calls
  - Always works
  - Standard format: `+1234567890`

### Why Email for FaceTime?
- ✅ More reliable (doesn't depend on number registration)
- ✅ Works on all Apple devices
- ✅ Partner can use any device with that email
- ✅ Less likely to fail

## 🧪 Testing

1. **Set up both fields** in Firestore for both users
2. **Send SOS** - Should try FaceTime first
3. **If FaceTime fails** - Should automatically call phone number
4. **Check console logs** - Shows which method was used

## 📊 Console Logs

When sending SOS, you'll see:
```
Sending SOS with: {
  hasFaceTimeContact: true,
  hasPhoneNumber: true,
  faceTimeContact: 'partner@email.com',
  phoneNumber: '***'
}
```

Then:
- `FaceTime launched successfully` - OR
- `FaceTime launch failed, will try phone call` → `Regular phone call launched as fallback`

---

**This smart system ensures your partner is always reachable!** 🎉

