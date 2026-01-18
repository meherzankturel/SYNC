# Firebase Setup Guide - Step by Step

This guide will walk you through setting up Firebase for your Couples App from scratch.

## Prerequisites

- A Google account
- Node.js installed (you already have this)
- Firebase CLI (we'll install it)

---

## Step 1: Install Firebase CLI

Open your terminal and run:

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## Step 2: Create a Firebase Project

### 2.1 Go to Firebase Console

1. Open your web browser
2. Go to: https://console.firebase.google.com/
3. Sign in with your Google account

### 2.2 Create New Project

1. Click **"Add project"** or **"Create a project"**
2. **Project name**: Enter something like `couples-app` or `my-couples-app`
3. Click **"Continue"**
4. **Google Analytics**: 
   - For this app, you can disable it (toggle off)
   - Or enable it if you want analytics (optional)
5. Click **"Create project"**
6. Wait for project creation (30-60 seconds)
7. Click **"Continue"**

---

## Step 3: Enable Firebase Services

### 3.1 Enable Authentication

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click on the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

### 3.2 Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. **Security rules**: Select **"Start in test mode"** (we'll update rules later)
4. Click **"Next"**
5. **Cloud Firestore location**: Choose a location close to you (e.g., `us-central1`)
6. Click **"Enable"**
7. Wait for database creation (30-60 seconds)

### 3.3 Enable Cloud Functions (Optional for now)

1. Click **"Functions"** in the left sidebar
2. Click **"Get started"**
3. Follow the prompts to enable Functions (may require billing account setup)

---

## Step 4: Get Your Firebase Configuration

### 4.1 Get Web App Config

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>` (or "Add app" → Web)
5. **App nickname**: Enter `Couples App Web`
6. **Firebase Hosting**: Leave unchecked for now
7. Click **"Register app"**
8. **Copy the config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Keep this window open** - you'll need these values!

---

## Step 5: Update Your App Configuration

### 5.1 Update Firebase Config File

1. Open `src/config/firebase.ts` in your code editor
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
    apiKey: "AIzaSy...",  // ← Paste your apiKey here
    authDomain: "your-project.firebaseapp.com",  // ← Paste your authDomain here
    projectId: "your-project-id",  // ← Paste your projectId here
    storageBucket: "your-project.appspot.com",  // ← Paste your storageBucket here
    messagingSenderId: "123456789",  // ← Paste your messagingSenderId here
    appId: "1:123456789:web:abc123"  // ← Paste your appId here
};
```

3. Save the file

---

## Step 6: Login to Firebase CLI

In your terminal, run:

```bash
firebase login
```

1. This will open a browser window
2. Sign in with the same Google account you used for Firebase Console
3. Allow Firebase CLI access
4. Return to terminal - you should see "Success! Logged in as: your-email@gmail.com"

---

## Step 7: Initialize Firebase in Your Project

### 7.1 Link Your Project

```bash
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp
firebase init
```

### 7.2 Follow the Prompts:

1. **"Which Firebase features do you want to set up?"**
   - Use arrow keys and spacebar to select:
   - ✅ **Firestore** (press space to select)
   - ✅ **Functions** (press space to select)
   - ✅ **Firestore Rules** (press space to select)
   - Press **Enter** to continue

2. **"Please select an option"**
   - Select **"Use an existing project"**
   - Press **Enter**

3. **"Select a default Firebase project"**
   - Select your project (the one you just created)
   - Press **Enter**

4. **"What file should be used for Firestore Rules?"**
   - Press **Enter** (default: `firestore.rules`)

5. **"What file should be used for Firestore indexes?"**
   - Press **Enter** (default: `firestore.indexes.json`)

6. **"What language should be used to write Cloud Functions?"**
   - Select **TypeScript**
   - Press **Enter**

7. **"Do you want to use ESLint to catch probable bugs and enforce style?"**
   - Type **Yes** or **No** (your choice)
   - Press **Enter**

8. **"Do you want to install dependencies with npm now?"**
   - Type **Yes**
   - Press **Enter**

9. **"File functions/src/index.ts already exists. Overwrite?"**
   - Type **No** (we already have our functions)
   - Press **Enter**

---

## Step 8: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

You should see:
```
✔  Deploy complete!
```

---

## Step 9: Test Your Connection

### 9.1 Install Firebase SDK (if not already installed)

```bash
npm install firebase
```

### 9.2 Create a Test File

Create `test-firebase.ts` in your project root:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Paste your config here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase initialized successfully!");
console.log("Auth:", auth);
console.log("Firestore:", db);
```

### 9.3 Test in Your App

1. Start your app:
```bash
npm start
```

2. Try to sign up a new user in the app
3. Check Firebase Console → Authentication → Users
4. You should see the new user!

---

## Step 10: Set Up Cloud Functions (Optional but Recommended)

### 10.1 Install Functions Dependencies

```bash
cd functions
npm install
```

### 10.2 Build Functions

```bash
npm run build
```

### 10.3 Deploy Functions

```bash
firebase deploy --only functions
```

**Note**: This may require you to:
- Enable billing in Firebase Console
- Wait a few minutes for deployment

---

## Step 11: Verify Everything Works

### Check Authentication:
1. Go to Firebase Console → Authentication
2. Try creating a user in your app
3. You should see the user appear here

### Check Firestore:
1. Go to Firebase Console → Firestore Database
2. After using the app, you should see collections like:
   - `users`
   - `pairs`
   - `moods`
   - etc.

### Check Functions:
1. Go to Firebase Console → Functions
2. You should see your deployed functions listed

---

## Troubleshooting

### Error: "Firebase: Error (auth/network-request-failed)"
- Check your internet connection
- Verify your Firebase config is correct
- Make sure you're using the Web app config (not iOS/Android)

### Error: "Permission denied"
- Make sure you deployed Firestore rules: `firebase deploy --only firestore:rules`
- Check that rules are correct in `firestore.rules`

### Error: "Functions deployment failed"
- Make sure billing is enabled (Cloud Functions requires billing)
- Check that you're in the `functions` directory
- Run `npm install` in the `functions` folder

### Can't see data in Firestore
- Make sure you're looking at the correct project
- Check that your app is actually writing data
- Verify Firestore rules allow your operations

---

## Next Steps

Once Firebase is connected:

1. ✅ Test authentication (sign up, sign in)
2. ✅ Test creating a pair
3. ✅ Test submitting a mood
4. ✅ Deploy Cloud Functions for notifications
5. ✅ Set up Cloud Scheduler for reminders

---

## Quick Reference

### Firebase Console
https://console.firebase.google.com/

### Your Project Settings
Firebase Console → ⚙️ → Project settings → Your apps

### Firestore Rules
File: `firestore.rules`
Deploy: `firebase deploy --only firestore:rules`

### Cloud Functions
Directory: `functions/`
Deploy: `firebase deploy --only functions`

---

## Security Note

⚠️ **Important**: Your Firebase config contains an API key. This is safe to include in your app because:
- The API key is restricted by Firebase Security Rules
- It's public in client-side apps (this is normal)
- Real security comes from Firestore Rules (which we've set up)

However, never commit sensitive data like:
- Service account keys
- Admin SDK keys
- Private keys

---

## You're All Set! 🎉

Your Firebase project is now connected! You can start using all the services we built:
- Authentication
- Firestore database
- Cloud Functions
- Real-time updates

Happy coding! 💕

