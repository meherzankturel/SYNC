# Firebase Setup for Boundless - Complete Guide

This is your complete step-by-step guide to connect Firebase to your **Boundless** app.

---

## 📋 Prerequisites

- ✅ A Google account
- ✅ Node.js installed (you have this)
- ✅ Terminal/Command line access

---

## Step 1: Install Firebase CLI

Open your terminal and run:

```bash
npm install -g firebase-tools
```

Verify it worked:
```bash
firebase --version
```

You should see a version number like `13.0.0` or similar.

---

## Step 2: Login to Firebase

```bash
firebase login
```

This will:
1. Open a browser window
2. Ask you to sign in with your Google account
3. Ask for permissions (click "Allow")
4. Show "Success! Logged in as: your-email@gmail.com" in terminal

---

## Step 3: Create Firebase Project

### 3.1 Go to Firebase Console

1. Open your web browser
2. Go to: **https://console.firebase.google.com/**
3. Sign in with the same Google account

### 3.2 Create New Project

1. Click **"Add project"** or **"Create a project"** button
2. **Project name**: Enter `boundless` (or `boundless-app`)
3. Click **"Continue"**
4. **Google Analytics**: 
   - You can disable this (toggle it off) - it's optional
   - Or enable it if you want analytics
5. Click **"Create project"**
6. Wait 30-60 seconds for project creation
7. Click **"Continue"** when done

You should now see your project dashboard!

---

## Step 4: Enable Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"** button
3. Click on the **"Sign-in method"** tab (at the top)
4. Find **"Email/Password"** in the list
5. Click on it
6. Toggle **"Enable"** to **ON** (green)
7. Click **"Save"**

✅ Authentication is now enabled!

---

## Step 5: Create Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** button
3. **Security rules**: Select **"Start in test mode"**
   - Don't worry, we'll deploy proper rules later!
4. Click **"Next"**
5. **Cloud Firestore location**: 
   - Choose a location close to you (e.g., `us-central1`, `us-east1`)
   - This affects performance, so pick the closest one
6. Click **"Enable"**
7. Wait 30-60 seconds for database creation

✅ Firestore database is now created!

---

## Step 6: Get Your Firebase Configuration

This is the most important step! You need to copy your Firebase config.

### 6.1 Open Project Settings

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview" (top left)
2. Click **"Project settings"**

### 6.2 Add Web App

1. Scroll down to the **"Your apps"** section
2. You'll see icons for different platforms (iOS, Android, Web)
3. Click the **Web icon** `</>` (or click **"Add app"** → **Web**)

### 6.3 Register Your App

1. **App nickname**: Enter `Boundless` (or `Boundless Web`)
2. **Firebase Hosting**: Leave this unchecked (we don't need it)
3. Click **"Register app"**

### 6.4 Copy Your Config

You'll see a code snippet that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "boundless-xxxxx.firebaseapp.com",
  projectId: "boundless-xxxxx",
  storageBucket: "boundless-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

**IMPORTANT**: Copy this entire config object! You'll need it in the next step.

💡 **Tip**: Keep this browser tab open - you might need to reference it.

---

## Step 7: Update Your App Configuration

### 7.1 Open the Config File

1. Open your code editor (VS Code, etc.)
2. Navigate to: `src/config/firebase.ts`
3. You should see placeholder values like `YOUR_API_KEY`, etc.

### 7.2 Replace with Your Config

Replace the `firebaseConfig` object with the one you copied from Firebase Console:

```typescript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // ← Paste your apiKey
    authDomain: "boundless-xxxxx.firebaseapp.com",  // ← Paste your authDomain
    projectId: "boundless-xxxxx",                   // ← Paste your projectId
    storageBucket: "boundless-xxxxx.appspot.com",   // ← Paste your storageBucket
    messagingSenderId: "123456789012",              // ← Paste your messagingSenderId
    appId: "1:123456789012:web:abcdef123456789"    // ← Paste your appId
};
```

### 7.3 Save the File

Press `Cmd+S` (Mac) or `Ctrl+S` (Windows) to save.

✅ Your app is now configured!

---

## Step 8: Initialize Firebase in Your Project

### 8.1 Navigate to Project Directory

In your terminal, make sure you're in the project directory:

```bash
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp
```

### 8.2 Run Firebase Init

```bash
firebase init
```

### 8.3 Follow the Prompts

You'll see several questions. Here's what to select:

**Question 1: "Which Firebase features do you want to set up?"**
- Use arrow keys to navigate
- Press **Space** to select (you'll see a checkmark ✅)
- Select:
  - ✅ **Firestore**
  - ✅ **Functions**
  - ✅ **Firestore Rules**
- Press **Enter** to continue

**Question 2: "Please select an option"**
- Select **"Use an existing project"**
- Press **Enter**

**Question 3: "Select a default Firebase project"**
- You'll see a list of your projects
- Select the one you just created (should be `boundless` or `boundless-app`)
- Press **Enter**

**Question 4: "What file should be used for Firestore Rules?"**
- Just press **Enter** (default: `firestore.rules` is correct)

**Question 5: "What file should be used for Firestore indexes?"**
- Just press **Enter** (default: `firestore.indexes.json` is fine)

**Question 6: "What language should be used to write Cloud Functions?"**
- Select **TypeScript** (use arrow keys)
- Press **Enter**

**Question 7: "Do you want to use ESLint to catch probable bugs and enforce style?"**
- Type **Yes** or **No** (your choice, doesn't matter much)
- Press **Enter**

**Question 8: "Do you want to install dependencies with npm now?"**
- Type **Yes**
- Press **Enter**
- Wait for installation to complete

**Question 9: "File functions/src/index.ts already exists. Overwrite?"**
- Type **No** (we already have our functions!)
- Press **Enter**

✅ Firebase is now initialized in your project!

---

## Step 9: Deploy Firestore Security Rules

This step deploys the security rules that protect your database:

```bash
firebase deploy --only firestore:rules
```

You should see:
```
✔  Deploy complete!
```

✅ Security rules are now deployed!

---

## Step 10: Test Your Connection

### 10.1 Start Your App

```bash
npm start
```

### 10.2 Test Sign Up

1. Open the app on your phone/simulator
2. Navigate to the Sign Up screen
3. Create a test account:
   - Email: `test@example.com`
   - Password: `test123456`
4. Click "Sign Up"

### 10.3 Verify in Firebase Console

1. Go back to Firebase Console
2. Click **"Authentication"** in the left sidebar
3. Click **"Users"** tab
4. **You should see your test user!** 🎉

If you see the user, **congratulations! Firebase is connected!** ✅

---

## Step 11: (Optional) Set Up Cloud Functions

Cloud Functions enable notifications and server-side features.

### 11.1 Navigate to Functions Directory

```bash
cd functions
```

### 11.2 Install Dependencies

```bash
npm install
```

This may take a minute or two.

### 11.3 Build Functions

```bash
npm run build
```

### 11.4 Deploy Functions

```bash
firebase deploy --only functions
```

**Note**: This may require:
- Enabling billing in Firebase Console (free tier is fine)
- Waiting a few minutes for deployment

You can skip this step for now and come back to it later if you want.

---

## ✅ Verification Checklist

Make sure everything works:

- [ ] Can sign up a new user in the app
- [ ] User appears in Firebase Console → Authentication → Users
- [ ] No errors in the app
- [ ] No errors in terminal/console
- [ ] Firestore rules deployed successfully

---

## 🎉 Success!

If you can sign up users and see them in Firebase Console, you're all set!

Your **Boundless** app is now connected to Firebase! 🚀

---

## 🆘 Troubleshooting

### Error: "Firebase: Error (auth/network-request-failed)"
- Check your internet connection
- Verify your Firebase config is correct
- Make sure you're using the Web app config (not iOS/Android)

### Error: "Permission denied"
- Make sure you deployed rules: `firebase deploy --only firestore:rules`
- Check that rules file exists: `firestore.rules`

### Can't see users in Firebase Console
- Make sure you're looking at the correct project
- Check that your app is actually writing data
- Verify Firestore rules allow your operations

### Functions won't deploy
- You may need to enable billing (free tier is fine)
- Make sure you're in the `functions` directory
- Run `npm install` in `functions` folder first

---

## 📚 Next Steps

Now that Firebase is connected:

1. ✅ Test authentication (sign up, sign in)
2. ✅ Test creating a pair
3. ✅ Test submitting a mood
4. ✅ Deploy Cloud Functions for notifications
5. ✅ Start building features!

---

## 📝 Quick Reference

**Firebase Console**: https://console.firebase.google.com/

**Your Config File**: `src/config/firebase.ts`

**Deploy Rules**: `firebase deploy --only firestore:rules`

**Deploy Functions**: `cd functions && firebase deploy --only functions`

---

**You're all set! Happy building with Boundless! 💕**

