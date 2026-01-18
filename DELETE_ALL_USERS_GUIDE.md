# Guide to Delete All Users and Start Fresh

⚠️ **WARNING**: This will permanently delete ALL users and their data. This cannot be undone!

## What Will Be Deleted

- All user accounts in Firebase Authentication
- All user documents in Firestore `users` collection
- All related data (pairs, moods, SOS events, signals, etc.)

## Method 1: Delete via Firebase Console (Recommended)

### Step 1: Delete Users from Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **boundless-d2a20**
3. Click **Authentication** in the left sidebar
4. Click **Users** tab
5. You'll see a list of all users
6. **Select all users**:
   - Click the checkbox at the top to select all
   - Or manually select each user
7. Click **Delete** button (trash icon) at the top
8. Confirm deletion

### Step 2: Delete User Documents from Firestore

1. Still in Firebase Console
2. Click **Firestore Database** in the left sidebar
3. Click on the **`users`** collection
4. **Delete all documents**:
   - Click on each document
   - Click **Delete** (trash icon)
   - Confirm deletion
   - Repeat for all documents

   **OR** (if you have many documents):
   - Use the Firebase CLI (see Method 2 below)

### Step 3: Clean Up Related Collections (Optional but Recommended)

Delete data from these collections to start completely fresh:

1. **`pairs`** collection - Delete all pair documents
2. **`moods`** collection - Delete all mood documents
3. **`sosEvents`** collection - Delete all SOS event documents
4. **`signals`** collection - Delete all signal documents
5. Any other collections you've created

**To delete collections:**
- Go to Firestore Database
- Click on each collection
- Delete all documents in that collection

## Method 2: Delete via Firebase CLI (Faster for Many Users)

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Delete Users from Authentication

Create a script to delete all users:

```bash
# Create a temporary script file
cat > delete-users.js << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deleteAllUsers() {
  const auth = admin.auth();
  let nextPageToken;
  
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    const uids = listUsersResult.users.map(user => user.uid);
    
    if (uids.length > 0) {
      await auth.deleteUsers(uids);
      console.log(`Deleted ${uids.length} users`);
    }
    
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  
  console.log('All users deleted!');
}

deleteAllUsers().catch(console.error);
EOF
```

**Note**: This requires a service account key. For most users, Method 1 (Console) is easier.

### Step 4: Delete Firestore Collections

You can use Firebase Console or write a script. Console is easier for most cases.

## Method 3: Quick Reset via Console (Easiest)

### Complete Reset Steps:

1. **Authentication → Users**:
   - Select all → Delete

2. **Firestore Database**:
   - Go to each collection (`users`, `pairs`, `moods`, `sosEvents`, `signals`)
   - Delete all documents in each collection

3. **Verify**:
   - Check Authentication: Should show 0 users
   - Check Firestore: Collections should be empty (or you can delete the collections entirely)

## After Deleting Users

### Create New Users

1. Open your app
2. Go to **Sign Up** screen
3. Create new accounts:
   - User 1: `meherzankturel@example.com` (or your email)
   - User 2: `meherzankhyati@example.com` (or partner's email)

### Add Contact Information

After creating users, add their contact info:

1. Go to **Firestore Database** → `users` collection
2. Find each user document (by email)
3. Add fields:
   - `phoneNumber`: `"+1234567890"`
   - `faceTimeContact`: `"user@example.com"`

### Link Users Together

1. In the app, one user should:
   - Go to settings/invite screen
   - Send invite to partner's email
2. Partner accepts invite
3. Users are now linked

## Quick Checklist

- [ ] Delete all users from Authentication
- [ ] Delete all documents from `users` collection
- [ ] Delete all documents from `pairs` collection
- [ ] Delete all documents from `moods` collection
- [ ] Delete all documents from `sosEvents` collection
- [ ] Delete all documents from `signals` collection
- [ ] Verify all collections are empty
- [ ] Create new user accounts
- [ ] Add contact information to new users
- [ ] Link users together

## Important Notes

1. **Backup First** (if you want to keep any data):
   - Export Firestore data before deleting
   - Go to Firestore → Settings → Export

2. **Security Rules**: Make sure your Firestore security rules allow deletion (they should for admin/authenticated users)

3. **Cloud Functions**: If you have Cloud Functions that trigger on user deletion, they will run. Make sure that's okay.

4. **Billing**: Deleting data doesn't affect billing immediately, but it will reduce storage costs over time.

## Troubleshooting

**Can't delete users?**
- Make sure you're logged in as the project owner
- Check that you have proper permissions

**Collections won't delete?**
- You can't delete collections directly, only documents
- Delete all documents, and the collection will be empty (effectively deleted)

**Want to keep some data?**
- Export specific collections before deleting
- Or manually select which documents to keep

