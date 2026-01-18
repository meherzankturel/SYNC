#!/bin/bash

# Clean install script for SDK 54 upgrade

echo "🧹 Cleaning old dependencies..."
rm -rf node_modules package-lock.json .expo

echo "📦 Installing dependencies..."
npm install

echo "🔧 Fixing package versions to SDK 54..."
npx expo install --fix

echo "✅ Done! Now run: npm start"

