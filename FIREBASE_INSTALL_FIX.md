# Firebase CLI Installation Fix

## The Problem
You're getting "command not found: firebase" because Firebase CLI isn't installed.

## Solution Options

### Option 1: Use npx (Recommended - No Installation Needed)

You can use Firebase CLI without installing it globally by using `npx`:

```bash
# Login to Firebase
npx firebase-tools login

# Initialize Firebase
npx firebase-tools init

# Deploy rules
npx firebase-tools deploy --only firestore:rules
```

**Note**: Just add `npx firebase-tools` instead of `firebase` before each command.

---

### Option 2: Install Locally in Project (Alternative)

Install Firebase CLI as a project dependency:

```bash
npm install firebase-tools --save-dev
```

Then use it with npx:
```bash
npx firebase login
npx firebase init
npx firebase deploy --only firestore:rules
```

---

### Option 3: Fix Global Installation (If You Have Admin Access)

If you have admin/sudo access, you can try:

```bash
sudo npm install -g firebase-tools
```

Or fix npm permissions:
```bash
sudo chown -R $(whoami) /usr/local/lib/node_modules
npm install -g firebase-tools
```

---

## Recommended: Use npx

For now, I recommend using **Option 1** (npx) - it's the easiest and doesn't require any special permissions.

### Quick Commands with npx:

```bash
# 1. Login
npx firebase-tools login

# 2. Initialize (when ready)
npx firebase-tools init

# 3. Deploy rules
npx firebase-tools deploy --only firestore:rules
```

---

## Next Steps

1. **First, login to Firebase:**
   ```bash
   npx firebase-tools login
   ```

2. **Then follow the setup guide:**
   - Read `FIREBASE_SETUP_BOUNDLESS.md`
   - Or `FIREBASE_QUICK_START.md`

3. **When you get to `firebase init`, use:**
   ```bash
   npx firebase-tools init
   ```

---

## All Firebase Commands with npx

Replace `firebase` with `npx firebase-tools`:

- `npx firebase-tools login`
- `npx firebase-tools init`
- `npx firebase-tools deploy --only firestore:rules`
- `npx firebase-tools deploy --only functions`
- `npx firebase-tools --version`

That's it! You're ready to go! 🚀

