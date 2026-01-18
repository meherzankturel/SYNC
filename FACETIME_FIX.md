# 🔧 FaceTime Error Fix

## The Problem

You're seeing this error:
> "Choose Another Phone Number or Email Address to Call "My Work Phone""
> "+14374298754" in the contact card is not available for FaceTime.

**This means:** The phone number exists, but that specific number isn't registered for FaceTime on the recipient's device.

## ✅ What I Fixed

I've updated the FaceTime launch logic to:

1. **Try FaceTime first** - Attempts to launch FaceTime
2. **Fallback to regular phone call** - If FaceTime fails, automatically tries a regular phone call
3. **Better error handling** - Won't break the SOS flow if FaceTime fails

## 🎯 Solutions

### Option 1: Use Partner's Email (Best for FaceTime)

If your partner has FaceTime set up with their email:

1. **In Firebase Console:**
   - Go to `users` collection
   - Click on partner's document
   - Add or update `phoneNumber` field with their **email address**
   - Example: `partner@email.com`

2. **FaceTime will use email instead of phone number**

### Option 2: Use Different Phone Number

If partner has multiple numbers:

1. **Find which number is registered for FaceTime:**
   - Partner should check Settings → FaceTime
   - See which number/email is listed

2. **Update in Firestore:**
   - Use the number that's registered for FaceTime
   - Or use their email address

### Option 3: Regular Phone Call (Works Now!)

The app now **automatically falls back to regular phone call** if FaceTime fails. So:

- ✅ SOS notification is sent
- ✅ Regular phone call is launched (if FaceTime unavailable)
- ✅ Partner can still be reached

## 📱 How It Works Now

**When you send SOS:**

1. **First:** Tries to launch FaceTime
2. **If FaceTime fails:** Automatically tries regular phone call
3. **SOS notification:** Always sent (most important part!)

**The phone call will work even if FaceTime doesn't!**

## 🔍 Check Partner's FaceTime Settings

Partner should check:
- Settings → FaceTime
- See which numbers/emails are registered
- Use one of those in the app

## 💡 Recommendation

**Best approach:** Use partner's **email address** for FaceTime:
- More reliable
- Works across devices
- Doesn't depend on phone number registration

**To update:**
1. Get partner's email (the one they use for FaceTime)
2. In Firestore → `users` → Partner's document
3. Update `phoneNumber` field to their email
4. Or add a new field `faceTimeEmail` and we can update the code to use that

---

**The good news:** SOS notification is working! The phone call fallback will work too. FaceTime is just a nice-to-have bonus. 🎉

