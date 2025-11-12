#!/bin/bash

# SMS Webhook Dashboard Launcher
echo "🚀 Starting SMS Webhook Dashboard..."
echo ""

# Change to the serverless directory
cd "$(dirname "$0")/serverless"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the dashboard server
echo "🌐 Starting dashboard server on http://localhost:3000"
echo ""
echo "Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node dashboard-server.js
