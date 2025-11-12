const axios = require('axios');

exports.handler = async function(context, event, callback) {
    const response = new context.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (event.request.method === 'OPTIONS') {
        response.setStatusCode(200);
        return callback(null, response);
    }

    try {
        // Extract data from Twilio webhook payload
        const {
            From: phoneNumber,
            Body: messageBody,
            MessageSid: messageSid,
            AccountSid: accountSid,
            To: toNumber
        } = event;

        console.log(`📱 Received SMS: ${phoneNumber} - "${messageBody}"`);

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Check if message contains opt-out keywords
        const isOptOut = checkOptOutKeywords(messageBody);
        const isOptIn = checkOptInKeywords(messageBody);

        if (!isOptOut && !isOptIn) {
            console.log(`ℹ️  Ignoring non-opt message: "${messageBody}"`);
            response.setStatusCode(200);
            response.setBody({ status: 'ignored', message: 'Not an opt-out/opt-in message' });
            return callback(null, response);
        }

        // Determine the action
        const action = isOptOut ? 'opt_out' : 'opt_in';
        const smsOptOutValue = isOptOut ? true : false;

        // MOCK: Simulate database update
        console.log(`🔄 ${action.toUpperCase()}: ${normalizedPhone}`);
        console.log(`📊 Would update IMPOWR database: sms_opt_out = ${smsOptOutValue}`);
        
        // MOCK: Simulate logging
        console.log(`📝 Logging event: ${action} for ${normalizedPhone} at ${new Date().toISOString()}`);

        // Send response back to Twilio
        response.setStatusCode(200);
        response.setBody({ 
            status: 'success', 
            action,
            phoneNumber: normalizedPhone,
            message: `Successfully processed ${action} for ${normalizedPhone}`,
            mock: true
        });

        return callback(null, response);

    } catch (error) {
        console.error('❌ SMS webhook error:', error);
        
        response.setStatusCode(500);
        response.setBody({ 
            status: 'error', 
            message: 'Internal server error processing webhook' 
        });

        return callback(null, response);
    }
};

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, remove the leading 1
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = cleaned.substring(1);
    }
    
    // Ensure it's 10 digits
    if (cleaned.length === 10) {
        return `+1${cleaned}`;
    }
    
    // If it already has country code, return as is
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned}`;
    }
    
    return phoneNumber; // Return original if can't normalize
}

/**
 * Check if message contains opt-out keywords
 */
function checkOptOutKeywords(messageBody) {
    if (!messageBody) return false;
    
    const optOutKeywords = ['OPT OUT'];
    const upperMessage = messageBody.toUpperCase().trim();
    
    return optOutKeywords.some(keyword => upperMessage.includes(keyword));
}

/**
 * Check if message contains opt-in keywords
 */
function checkOptInKeywords(messageBody) {
    if (!messageBody) return false;
    
    const optInKeywords = ['OPT IN'];
    const upperMessage = messageBody.toUpperCase().trim();
    
    return optInKeywords.some(keyword => upperMessage.includes(keyword));
}
