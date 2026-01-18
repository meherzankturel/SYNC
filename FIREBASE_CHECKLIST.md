# Firebase Setup Checklist

Use this checklist to track your progress:

## Pre-Setup
- [ ] Node.js is installed (check: `node --version`)
- [ ] You have a Google account
- [ ] Terminal/Command line is ready

## Step 1: Install Firebase CLI
- [ ] Run: `npm install -g firebase-tools`
- [ ] Verify: `firebase --version` shows a version number
- [ ] Run: `firebase login`
- [ ] Successfully logged in (see your email in terminal)

## Step 2: Create Firebase Project
- [ ] Opened https://console.firebase.google.com/
- [ ] Clicked "Add project"
- [ ] Entered project name
- [ ] Completed project creation
- [ ] Project is visible in Firebase Console

## Step 3: Enable Authentication
- [ ] Clicked "Authentication" in Firebase Console
- [ ] Clicked "Get started"
- [ ] Clicked "Sign-in method" tab
- [ ] Enabled "Email/Password"
- [ ] Saved changes

## Step 4: Create Firestore Database
- [ ] Clicked "Firestore Database"
- [ ] Clicked "Create database"
- [ ] Selected "Start in test mode"
- [ ] Selected a location
- [ ] Database created successfully

## Step 5: Get Firebase Config
- [ ] Clicked gear icon ⚙️ → "Project settings"
- [ ] Scrolled to "Your apps" section
- [ ] Clicked Web icon `</>`
- [ ] Registered app with name
- [ ] **COPIED the config code** (keep it handy!)

## Step 6: Update App Config
- [ ] Opened `src/config/firebase.ts`
- [ ] Replaced `apiKey` with your actual apiKey
- [ ] Replaced `authDomain` with your actual authDomain
- [ ] Replaced `projectId` with your actual projectId
- [ ] Replaced `storageBucket` with your actual storageBucket
- [ ] Replaced `messagingSenderId` with your actual messagingSenderId
- [ ] Replaced `appId` with your actual appId
- [ ] Saved the file

## Step 7: Initialize Firebase in Project
- [ ] Navigated to project directory
- [ ] Ran: `firebase init`
- [ ] Selected: Firestore, Functions, Firestore Rules
- [ ] Selected: "Use an existing project"
- [ ] Selected your project from list
- [ ] Accepted default file names
- [ ] Selected TypeScript for Functions
- [ ] Installed dependencies

## Step 8: Deploy Firestore Rules
- [ ] Ran: `firebase deploy --only firestore:rules`
- [ ] Saw "✔ Deploy complete!" message

## Step 9: Test Connection
- [ ] Started app: `npm start`
- [ ] Opened app on phone/simulator
- [ ] Tried to sign up a new user
- [ ] Checked Firebase Console → Authentication
- [ ] **User appears in Authentication!** ✅

## Optional: Cloud Functions
- [ ] Navigated to `functions` directory
- [ ] Ran: `npm install`
- [ ] Ran: `npm run build`
- [ ] Ran: `firebase deploy --only functions`
- [ ] Functions appear in Firebase Console

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ You can sign up a new user in the app
- ✅ The user appears in Firebase Console → Authentication → Users
- ✅ No errors in the app console
- ✅ Firestore rules are deployed (check Firebase Console → Firestore → Rules)

---

## 📝 Notes

Write down your Firebase project details here:

**Project Name:** _______________________

**Project ID:** _______________________

**Region:** _______________________

**Config Location:** `src/config/firebase.ts`

---

## 🆘 If Something Goes Wrong

1. **Can't login to Firebase CLI:**
   - Make sure you're using the same Google account
   - Try: `firebase logout` then `firebase login` again

2. **Config not working:**
   - Double-check you copied ALL values correctly
   - Make sure you're using the Web app config (not iOS/Android)
   - Verify no extra spaces or quotes

3. **Permission errors:**
   - Make sure you deployed rules: `firebase deploy --only firestore:rules`
   - Check that rules file exists: `firestore.rules`

4. **Functions won't deploy:**
   - You may need to enable billing (free tier is fine)
   - Make sure you're in the `functions` directory
   - Run `npm install` in `functions` folder first

---

## ✅ Final Check

Before moving on, verify:
- [ ] Firebase config is correct in `src/config/firebase.ts`
- [ ] Can create users in the app
- [ ] Users appear in Firebase Console
- [ ] No errors in app or console

**You're ready to build! 🚀**

