/**
 * Simple test script for SMS webhook functionality
 * Run with: node test-webhook-simple.js
 */

const smsWebhook = require('./functions/sms-webhook');

// Mock context object
const mockContext = {
    IMPOWR_DB_URL: 'https://mock-impowr-api.com/api/v1',
    IMPOWR_DB_API_KEY: 'mock-impowr-key',
    LOGGING_DB_URL: 'https://mock-logging-api.com/api/v1',
    LOGGING_DB_API_KEY: 'mock-logging-key'
};

// Mock Response class
class MockResponse {
    constructor() {
        this.headers = {};
        this.statusCode = null;
        this.body = null;
    }
    
    appendHeader(name, value) {
        this.headers[name] = value;
    }
    
    setStatusCode(code) {
        this.statusCode = code;
    }
    
    setBody(body) {
        this.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
}

// Mock axios
const mockAxios = {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn()
};

// Test function
async function testWebhook() {
    console.log('🧪 Testing SMS Webhook Functionality\n');
    console.log('=====================================\n');

    // Test 1: Opt-out message (STOP)
    console.log('📱 Test 1: Opt-out message (STOP)');
    console.log('----------------------------------');
    
    const stopEvent = {
        From: '+1234567890',
        Body: 'STOP',
        MessageSid: 'SM123456789',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    // Mock successful database responses
    mockAxios.get.mockResolvedValue({
        data: {
            contacts: [{
                id: 'contact123',
                phone_number: '+1234567890'
            }]
        }
    });

    mockAxios.patch.mockResolvedValue({
        status: 200,
        data: { success: true }
    });

    mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
    });

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhook.handler(mockContext, stopEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        console.log(`✅ Status: ${result.statusCode}`);
        console.log(`📄 Response: ${result.body}`);
        console.log(`🔍 Expected: Opt-out processing\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 2: Opt-in message (START)
    console.log('📱 Test 2: Opt-in message (START)');
    console.log('----------------------------------');
    
    const startEvent = {
        From: '+1234567890',
        Body: 'START',
        MessageSid: 'SM987654321',
        AccountSid: 'AC123456789',
        To: '+1987654321',
        request: { method: 'POST' }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            smsWebhook.handler(mockContext, startEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        console.log(`✅ Status: ${result.statusCode}`);
        console.log(`📄 Response: ${result.body}`);
        console.log(`🔍 Expected: Opt-in processing\n`);
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
            smsWebhook.handler(mockContext, regularEvent, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });

        console.log(`✅ Status: ${result.statusCode}`);
        console.log(`📄 Response: ${result.body}`);
        console.log(`🔍 Expected: Message ignored\n`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
    }

    // Test 4: Multiple opt-out keywords
    console.log('📱 Test 4: Different opt-out keywords');
    console.log('-------------------------------------');
    
    const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END', 'OPT OUT'];
    
    for (const keyword of optOutKeywords) {
        const keywordEvent = {
            From: '+1234567890',
            Body: keyword,
            MessageSid: `SM${Math.random().toString().substr(2, 9)}`,
            AccountSid: 'AC123456789',
            To: '+1987654321',
            request: { method: 'POST' }
        };

        try {
            const result = await new Promise((resolve, reject) => {
                smsWebhook.handler(mockContext, keywordEvent, (error, response) => {
                    if (error) reject(error);
                    else resolve(response);
                });
            });

            console.log(`✅ "${keyword}" -> Status: ${result.statusCode}`);
        } catch (error) {
            console.log(`❌ "${keyword}" -> Error: ${error.message}`);
        }
    }

    console.log('\n🎉 Testing complete!');
    console.log('\n📋 Summary:');
    console.log('- Opt-out keywords should trigger opt-out processing');
    console.log('- Opt-in keywords should trigger opt-in processing'); 
    console.log('- Regular messages should be ignored');
    console.log('- All requests should return HTTP 200');
}

// Mock jest functions for compatibility
global.jest = {
    fn: () => ({
        mockResolvedValue: (value) => {
            return Promise.resolve(value);
        },
        mockRejectedValue: (error) => {
            return Promise.reject(error);
        }
    })
};

// Run the test
testWebhook().catch(console.error);
