/**
 * Simple keyword testing for opt-in/opt-out functionality
 * Run with: node test-keywords.js
 */

// Simplified keyword detection functions - only OPT IN and OPT OUT
function checkOptOutKeywords(messageBody) {
    if (!messageBody) return false;
    
    const optOutKeywords = ['OPT OUT'];
    const upperMessage = messageBody.toUpperCase().trim();
    
    return optOutKeywords.some(keyword => upperMessage.includes(keyword));
}

function checkOptInKeywords(messageBody) {
    if (!messageBody) return false; 
    
    const optInKeywords = ['OPT IN'];
    const upperMessage = messageBody.toUpperCase().trim();
    
    return optInKeywords.some(keyword => upperMessage.includes(keyword));
}

function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add +1 if it's a 10-digit US number
    if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    return cleaned;
}

// Simplified test cases - only OPT IN and OPT OUT
const testCases = [
    // Opt-out tests
    { message: 'OPT OUT', expected: 'opt_out', description: 'Simple OPT OUT' },
    { message: 'opt out', expected: 'opt_out', description: 'Lowercase OPT OUT' },
    { message: 'Please OPT OUT from messages', expected: 'opt_out', description: 'OPT OUT in sentence' },
    { message: 'I want to OPT OUT', expected: 'opt_out', description: 'OPT OUT phrase' },
    
    // Opt-in tests
    { message: 'OPT IN', expected: 'opt_in', description: 'Simple OPT IN' },
    { message: 'opt in', expected: 'opt_in', description: 'Lowercase OPT IN' },
    { message: 'Please OPT IN for updates', expected: 'opt_in', description: 'OPT IN in sentence' },
    { message: 'I want to OPT IN', expected: 'opt_in', description: 'OPT IN phrase' },
    
    // Regular messages (should be ignored)
    { message: 'Hello there!', expected: 'ignored', description: 'Regular greeting' },
    { message: 'How are you?', expected: 'ignored', description: 'Question' },
    { message: 'Thanks for the message', expected: 'ignored', description: 'Thank you' },
    { message: 'STOP', expected: 'ignored', description: 'STOP (not OPT OUT)' },
    { message: 'START', expected: 'ignored', description: 'START (not OPT IN)' },
];

// Phone number normalization tests
const phoneTests = [
    { input: '1234567890', expected: '+11234567890', description: '10-digit US number' },
    { input: '11234567890', expected: '+11234567890', description: '11-digit US number starting with 1' },
    { input: '+11234567890', expected: '+11234567890', description: 'Already formatted E.164' },
    { input: '(123) 456-7890', expected: '+11234567890', description: 'Formatted US number' },
    { input: '+44 20 7946 0958', expected: '+442079460958', description: 'UK number' },
];

console.log('🧪 Testing OPT IN / OPT OUT Keyword Detection');
console.log('==============================================\n');

// Test keyword detection
let passed = 0;
let total = testCases.length;

testCases.forEach((testCase, index) => {
    const isOptOut = checkOptOutKeywords(testCase.message);
    const isOptIn = checkOptInKeywords(testCase.message);
    
    let result;
    if (isOptOut) {
        result = 'opt_out';
    } else if (isOptIn) {
        result = 'opt_in';
    } else {
        result = 'ignored';
    }
    
    const success = result === testCase.expected;
    if (success) passed++;
    
    const status = success ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${testCase.description}`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    if (!success) {
        console.log(`   ⚠️  MISMATCH!`);
    }
    console.log('');
});

console.log('📱 Testing Phone Number Normalization');
console.log('=====================================\n');

// Test phone number normalization
phoneTests.forEach((test, index) => {
    const result = normalizePhoneNumber(test.input);
    const success = result === test.expected;
    if (success) passed++;
    total++;
    
    const status = success ? '✅' : '❌';
    console.log(`${status} Phone Test ${index + 1}: ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: "${test.expected}", Got: "${result}"`);
    if (!success) {
        console.log(`   ⚠️  MISMATCH!`);
    }
    console.log('');
});

console.log('📊 Test Results Summary');
console.log('=======================');
console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${total - passed}/${total}`);
console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (passed === total) {
    console.log('\n🎉 All tests passed! The opt-in/opt-out detection is working correctly.');
} else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
}

console.log('\n📋 How to test with real webhook:');
console.log('1. Deploy your webhook: npm run deploy');
console.log('2. Configure Twilio webhook URL to point to your deployed function');
console.log('3. Send SMS messages with "STOP" or "START" to your Twilio number');
console.log('4. Check your database for opt-out status updates');
console.log('5. Monitor webhook logs: twilio-run logs --function=sms-webhook');
