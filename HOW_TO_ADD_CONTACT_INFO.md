# How to Add Contact Information for SOS Feature

## Problem
If you're getting the error "No contact information available" when trying to send SOS, it means your partner's contact information is not stored in their Firestore profile.

## Solution

Each user needs to have their contact information stored in their Firestore user document. The SOS feature looks for:

1. **Phone Number** (for regular calls):
   - Field: `phoneNumber` or `phone`
   - Example: `"+1234567890"` or `"1234567890"`

2. **FaceTime Contact** (for FaceTime calls):
   - Field: `faceTimeContact` or `faceTimeEmail`
   - Can be an email address or phone number
   - Example: `"user@example.com"` or `"+1234567890"`

3. **Email** (fallback for FaceTime):
   - Field: `email`
   - Used as fallback if `faceTimeContact` is not set

## How to Add Contact Info

### Option 1: Using Firebase Console (Quick Fix)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **boundless-d2a20**
3. Go to **Firestore Database**
4. Navigate to the `users` collection
5. Find the user document (by user ID)
6. Add the following fields:
   - `phoneNumber`: Your phone number (e.g., `"+1234567890"`)
   - `faceTimeContact`: Your FaceTime email or phone (e.g., `"your.email@example.com"`)

### Option 2: Add via App (Recommended - Future Feature)

We should add a settings/profile screen where users can:
1. Enter their phone number
2. Enter their FaceTime contact
3. Save to Firestore

For now, use Option 1 (Firebase Console).

## Example User Document Structure

```json
{
  "email": "meherzankhyati@example.com",
  "displayName": "Meherzan Khyati",
  "phoneNumber": "+1234567890",
  "faceTimeContact": "meherzankhyati@example.com",
  "partnerId": "partner-user-id",
  "pushToken": "expo-push-token-here"
}
```

## Debugging

When you trigger SOS, check the console logs. You should see:

```
🔍 Partner Data Debug: {
  partnerId: "...",
  hasPartnerData: true,
  partnerDataKeys: ["email", "phoneNumber", "faceTimeContact", ...],
  partnerData: {
    email: "...",
    phoneNumber: "...",
    faceTimeContact: "..."
  }
}
```

If `hasPartnerData` is `false` or the contact fields are missing, that's the issue.

## Quick Fix Steps

1. **Identify which user is missing contact info:**
   - User A can send SOS to User B ✅
   - User B cannot send SOS to User A ❌
   - → User A is missing contact info

2. **Add contact info for User A:**
   - Go to Firebase Console
   - Find User A's document in `users` collection
   - Add `phoneNumber` and/or `faceTimeContact` fields
   - Save

3. **Test again:**
   - User B should now be able to send SOS to User A

## Notes

- The phone number should include country code (e.g., `+1` for US)
- FaceTime contact can be an email address or phone number
- At least one contact method (phone or FaceTime) is required for SOS to work
- Email is used as a fallback for FaceTime if `faceTimeContact` is not set

