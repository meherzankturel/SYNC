#!/bin/bash

# Fix PlatformConstants native module error
# This happens when SDK versions don't match between project and Expo Go

echo "🔧 Fixing native module error (PlatformConstants not found)..."

# Step 1: Clean everything
echo "1️⃣  Cleaning old files..."
rm -rf node_modules package-lock.json .expo

# Step 2: Increase file watcher limit
echo "2️⃣  Setting file watcher limit..."
ulimit -n 4096

# Step 3: Install base dependencies with legacy peer deps
echo "3️⃣  Installing dependencies..."
npm install --legacy-peer-deps

# Step 4: Force upgrade expo to SDK 54
echo "4️⃣  Upgrading Expo to SDK 54..."
npm install expo@~54.0.0 --legacy-peer-deps

# Step 5: Upgrade react-native to 0.76.5 (SDK 54 compatible)
echo "5️⃣  Upgrading React Native to 0.76.5..."
npm install react-native@0.76.5 react@18.3.1 --legacy-peer-deps

# Step 6: Fix all package versions (correct syntax with double dash)
echo "6️⃣  Fixing all package versions to SDK 54..."
npx expo install --fix -- --legacy-peer-deps

echo ""
echo "✅ Fix complete!"
echo ""
echo "📱 Now run: npm start"
echo "   Then scan the QR code with Expo Go (SDK 54)"

