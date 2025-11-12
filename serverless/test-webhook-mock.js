/**
 * Test script using the mock webhook (no real database calls)
 * Run with: node test-webhook-mock.js
 */

const smsWebhookMock = require('./functions/sms-webhook-mock');

// Mock context object
const mockContext = {
    Response: function() {
        this.headers = {};
        this.statusCode = null;
        this.body = null;
        
        this.appendHeader = (name, value) => {
            this.headers[name] = value;
        };
        
        this.setStatusCode = (code) => {
            this.statusCode = code;
        };
        
        this.setBody = (body) => {
            this.body = typeof body === 'string' ? body : JSON.stringify(body);
        };
        
        return this;
    }
};

// Test function
async function testWebhook() {
    console.log('🧪 Testing SMS Webhook Functionality (Mock Mode)\n');
    console.log('==============================================\n');

    // Test 1: Opt-out message
    console.log('📱 Test 1: Opt-out message (OPT OUT)');
    console.log('----------------------------------');
    
    const optOutEvent = {
        From: '+1234567890',
        Body: 'OPT OUT',
        MessageSid: 'SM123456789',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhookMock.handler(mockContext, optOutEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const responseBody = JSON.parse(result.body);
        const success = result.statusCode === 200 && responseBody.action === 'opt_out';
        
        if (success) {
            console.log(`✅ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}`);
            console.log(`🔍 Expected: Opt-out processing\n`);
        } else {
            console.log(`❌ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}\n`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 2: Opt-in message
    console.log('📱 Test 2: Opt-in message (OPT IN)');
    console.log('----------------------------------');
    
    const optInEvent = {
        From: '+1234567890',
        Body: 'OPT IN',
        MessageSid: 'SM987654321',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhookMock.handler(mockContext, optInEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const responseBody = JSON.parse(result.body);
        const success = result.statusCode === 200 && responseBody.action === 'opt_in';
        
        if (success) {
            console.log(`✅ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}`);
            console.log(`🔍 Expected: Opt-in processing\n`);
        } else {
            console.log(`❌ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}\n`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 3: Regular message (should be ignored)
    console.log('📱 Test 3: Regular message (should be ignored)');
    console.log('----------------------------------------------');
    
    const regularEvent = {
        From: '+1234567890',
        Body: 'Hello, how are you?',
        MessageSid: 'SM555555555',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhookMock.handler(mockContext, regularEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const responseBody = JSON.parse(result.body);
        const success = result.statusCode === 200 && responseBody.status === 'ignored';
        
        if (success) {
            console.log(`✅ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}`);
            console.log(`🔍 Expected: Message ignored\n`);
        } else {
            console.log(`❌ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}\n`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 4: OPT OUT in sentence
    console.log('📱 Test 4: OPT OUT in sentence');
    console.log('------------------------------');
    
    const optOutSentenceEvent = {
        From: '+1234567890',
        Body: 'Please OPT OUT from messages',
        MessageSid: 'SM666666666',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhookMock.handler(mockContext, optOutSentenceEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const responseBody = JSON.parse(result.body);
        const success = result.statusCode === 200 && responseBody.action === 'opt_out';
        
        if (success) {
            console.log(`✅ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}`);
            console.log(`🔍 Expected: Opt-out processing\n`);
        } else {
            console.log(`❌ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}\n`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 5: OPT IN in sentence
    console.log('📱 Test 5: OPT IN in sentence');
    console.log('----------------------------');
    
    const optInSentenceEvent = {
        From: '+1234567890',
        Body: 'I want to OPT IN for updates',
        MessageSid: 'SM777777777',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhookMock.handler(mockContext, optInSentenceEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        const responseBody = JSON.parse(result.body);
        const success = result.statusCode === 200 && responseBody.action === 'opt_in';
        
        if (success) {
            console.log(`✅ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}`);
            console.log(`🔍 Expected: Opt-in processing\n`);
        } else {
            console.log(`❌ Status: ${result.statusCode}`);
            console.log(`📄 Response: ${result.body}\n`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    console.log('\n🎉 Testing complete!');
}

// Run the test
testWebhook().catch(console.error);
