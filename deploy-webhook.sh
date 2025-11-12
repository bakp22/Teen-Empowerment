#!/bin/bash

# Deploy SMS Opt-In/Opt-Out Webhook
# This script deploys the SMS webhook function and provides setup instructions

echo "🚀 Deploying SMS Opt-In/Opt-Out Webhook..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "serverless/functions/sms-webhook.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected to find: serverless/functions/sms-webhook.js"
    exit 1
fi

# Navigate to serverless directory
cd serverless

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Please create .env file with required environment variables:"
    echo "   - IMPOWR_DB_URL"
    echo "   - IMPOWR_DB_API_KEY"
    echo "   - LOGGING_DB_URL"
    echo "   - LOGGING_DB_API_KEY"
    echo ""
    echo "   See WEBHOOK_SETUP.md for details"
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy the function
echo "🚀 Deploying to Twilio..."
twilio-run deploy

# Get the deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your Twilio phone number webhook URL:"
echo "   https://your-runtime-domain.twil.io/sms-webhook"
echo ""
echo "2. Test the webhook by sending 'STOP' to your Twilio number"
echo ""
echo "3. Monitor logs with:"
echo "   twilio-run logs --function=sms-webhook"
echo ""
echo "4. Check the WEBHOOK_SETUP.md file for detailed configuration instructions"
echo ""

# Optional: Test the webhook
read -p "Would you like to test the webhook now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 Running webhook tests..."
    npm run test:webhook
fi

echo "🎉 Setup complete! Your SMS webhook is ready to handle opt-out/opt-in messages."
