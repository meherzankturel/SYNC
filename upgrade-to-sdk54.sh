#!/bin/bash

# Upgrade to Expo SDK 54 Script

echo "🔄 Upgrading to Expo SDK 54..."

# Remove old dependencies
echo "1. Removing old node_modules..."
rm -rf node_modules package-lock.json

# Install dependencies
echo "2. Installing dependencies..."
npm install

# Fix package versions to match SDK 54
echo "3. Fixing package versions to match SDK 54..."
npx expo install --fix

echo "✅ Upgrade complete!"
echo "📱 Now run: npm start"

