#!/bin/bash

echo "🚀 Starting MongoDB Backend Server..."
echo ""

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
MONGODB_URI=mongodb+srv://meherzankturel_db_user:V5cY1Stzli6OWckX@cluster0.qz3hz44.mongodb.net/couples_app?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🔍 Your computer's IP address (for physical device testing):"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1

echo ""
echo "🚀 Starting backend server..."
echo "📍 API will be available at: http://localhost:3000/api"
echo ""

npm run dev

