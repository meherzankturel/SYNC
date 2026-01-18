# Firebase Quick Start - 5 Minute Setup

Follow these steps to connect Firebase in 5 minutes:

## 🚀 Quick Steps

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Create Firebase Project
1. Go to: https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it: `boundless` (or `boundless-app`)
4. Click through the setup (disable Analytics if you want)

### 3. Enable Services
In Firebase Console:

**Authentication:**
- Click **Authentication** → **Get started**
- Click **Sign-in method** tab
- Enable **Email/Password** → Save

**Firestore:**
- Click **Firestore Database** → **Create database**
- Choose **"Start in test mode"**
- Choose location → **Enable**

### 4. Get Your Config
1. Click **⚙️** (gear icon) → **Project settings**
2. Scroll to **"Your apps"**
3. Click **Web icon** `</>`
4. Register app (name: "Boundless")
5. **Copy the config code** that looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  // ... etc
};
```

### 5. Update Your App
1. Open `src/config/firebase.ts`
2. Replace the placeholder values with your actual config
3. Save the file

### 6. Initialize Firebase in Project
```bash
cd /Users/meherzan/.gemini/antigravity/scratch/CouplesApp
# Note: Directory name is still CouplesApp, but project is now "Boundless"
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions  
- ✅ Firestore Rules
- Use existing project
- Select your project
- Use defaults for file names
- TypeScript for Functions
- Yes to install dependencies

### 7. Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### 8. Test It!
```bash
npm start
```

Try signing up a new user in the app, then check Firebase Console → Authentication to see if the user appears!

---

## ✅ Checklist

- [ ] Firebase CLI installed
- [ ] Logged into Firebase CLI
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Config copied from Firebase Console
- [ ] Config pasted into `src/config/firebase.ts`
- [ ] `firebase init` completed
- [ ] Firestore rules deployed
- [ ] Tested sign up in app

---

## 🆘 Need Help?

See `FIREBASE_SETUP_GUIDE.md` for detailed step-by-step instructions with screenshots descriptions.

---

## 🎯 What's Next?

Once connected:
1. Test authentication (sign up/login)
2. Deploy Cloud Functions: `cd functions && npm install && firebase deploy --only functions`
3. Start building features!

