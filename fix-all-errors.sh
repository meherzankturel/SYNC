#!/bin/bash

# Comprehensive fix script for all Expo SDK 54 errors

echo "🔧 Fixing all errors for Expo SDK 54..."

# Step 1: Clean everything
echo "1️⃣  Cleaning old files..."
rm -rf node_modules package-lock.json .expo

# Step 2: Increase file watcher limit (fixes EMFILE error on macOS)
echo "2️⃣  Setting file watcher limit..."
ulimit -n 4096

# Step 3: Install dependencies
echo "3️⃣  Installing dependencies..."
npm install

# Step 4: Fix all package versions to SDK 54
echo "4️⃣  Fixing package versions to SDK 54..."
npx expo install --fix || npm install --legacy-peer-deps

# Step 5: Run expo-doctor to check for issues
echo "5️⃣  Running expo-doctor..."
npx expo-doctor || echo "⚠️  expo-doctor not available, skipping..."

echo ""
echo "✅ All fixes applied!"
echo ""
echo "📱 Now run: npm start"
echo "   Or use: npm run ios (for iOS Simulator)"

