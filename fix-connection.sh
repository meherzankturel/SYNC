#!/bin/bash

# Fix Expo Connection Error Script
# This script clears Expo cache and restarts the dev server

echo "🔧 Fixing Expo connection error..."

# Kill any running Expo/Metro processes
echo "1. Stopping any running Expo processes..."
pkill -f "expo start" || true
pkill -f "metro" || true
pkill -f "node.*expo" || true

# Clear Expo cache
echo "2. Clearing Expo cache..."
npx expo start --clear

echo "✅ Done! The Expo dev server should now be running."
echo "📱 Scan the QR code with your phone or press 'i' for iOS simulator"

