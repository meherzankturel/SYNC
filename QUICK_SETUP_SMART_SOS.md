# ⚡ Quick Setup: Smart SOS Contacts

## 🎯 What You Need to Do

Add **two separate fields** to each user's profile in Firestore for the smart SOS system.

## 📝 Step-by-Step Setup

### For Your Profile (Current User):

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/
   - Project: **boundless-d2a20**
   - Click **Firestore Database**

2. **Click on `users` collection**

3. **Click on your user document** (ID: `GgC6TmD8j7R2snSylmeqknyeriA3`)

4. **Add Field 1: `faceTimeContact`**
   - Click **"+ Add field"**
   - **Field name:** `faceTimeContact`
   - **Type:** string
   - **Value:** Partner's email address (the one they use for FaceTime)
     - Example: `partner@email.com`
   - Click **"Update"**

5. **Add Field 2: `phoneNumber`** (if not already there)
   - Click **"+ Add field"**
   - **Field name:** `phoneNumber`
   - **Type:** string
   - **Value:** Partner's phone number for regular calls
     - Format: `+1234567890` (with country code)
     - Example: `+14374298754`
   - Click **"Update"**

### For Partner's Profile:

1. **Click on partner's user document** (ID: `pGlgln37m2M6607XMePc3ZEulio2`)

2. **Add Field 1: `faceTimeContact`**
   - **Value:** Your email address (the one you use for FaceTime)
   - Example: `meherzankhyati@gmail.com`

3. **Add Field 2: `phoneNumber`**
   - **Value:** Your phone number for regular calls
   - Format: `+1234567890`

## ✅ Final Structure

**Your Profile:**
```javascript
{
  email: "meherzankhyati@gmail.com",
  faceTimeContact: "partner@email.com",  // Partner's FaceTime email
  phoneNumber: "+14374298754",           // Partner's phone for calls
  pushToken: "...",
  partnerId: "pGlgln37m2M6607XMePc3ZEulio2"
}
```

**Partner's Profile:**
```javascript
{
  email: "partner@email.com",
  faceTimeContact: "meherzankhyati@gmail.com",  // Your FaceTime email
  phoneNumber: "+19876543210",                   // Your phone for calls
  pushToken: "...",
  partnerId: "GgC6TmD8j7R2snSylmeqknyeriA3"
}
```

## 🚀 How It Works Now

**When you send SOS:**

1. **First:** Tries FaceTime with `faceTimeContact` (email or number)
2. **If FaceTime fails:** Automatically calls `phoneNumber` (regular phone call)
3. **SOS notification:** Always sent (most important!)

**Result:** Your partner is always reachable! 🎉

## 💡 Why This is Better

- ✅ **Reliable:** If FaceTime fails, phone call works
- ✅ **Smart:** Uses best method first, falls back automatically
- ✅ **Flexible:** Can use email for FaceTime (more reliable)
- ✅ **Never fails:** Always has a backup method

## 🧪 Test It

1. **Set up both fields** for both users
2. **Send SOS** - Should try FaceTime first
3. **If FaceTime fails** - Should automatically call phone number
4. **Check console logs** - Shows which method was used

---

**That's it! Your smart SOS system is ready!** 🚀

