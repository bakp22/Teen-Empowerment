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

        console.log(`Received SMS webhook: ${phoneNumber} - ${messageBody}`);

        // Normalize phone number (remove +1 if present, ensure E.164 format)
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Check if message contains opt-out keywords
        const isOptOut = checkOptOutKeywords(messageBody);
        const isOptIn = checkOptInKeywords(messageBody);

        if (!isOptOut && !isOptIn) {
            // Not an opt-out or opt-in message, respond with 200 but don't process
            response.setStatusCode(200);
            response.setBody({ status: 'ignored', message: 'Not an opt-out/opt-in message' });
            return callback(null, response);
        }

        // Determine the action
        const action = isOptOut ? 'opt_out' : 'opt_in';
        const smsOptOutValue = isOptOut ? true : false;

        // Update IMPOWR database
        const updateResult = await updateIMPOWRDatabase(normalizedPhone, smsOptOutValue, context);
        
        // Log the event for auditing
        await logWebhookEvent({
            phoneNumber: normalizedPhone,
            originalPhoneNumber: phoneNumber,
            messageBody,
            messageSid,
            accountSid,
            toNumber,
            action,
            smsOptOutValue,
            updateResult,
            timestamp: new Date().toISOString()
        }, context);

        // Send response back to Twilio
        response.setStatusCode(200);
        response.setBody({ 
            status: 'success', 
            action,
            phoneNumber: normalizedPhone,
            message: `Successfully processed ${action} for ${normalizedPhone}`
        });

        return callback(null, response);

    } catch (error) {
        console.error('SMS webhook error:', error);
        
        // Log the error
        await logWebhookEvent({
            phoneNumber: event.From || 'unknown',
            messageBody: event.Body || 'unknown',
            error: error.message,
            timestamp: new Date().toISOString()
        }, context);

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

/**
 * Update IMPOWR database with opt-out/opt-in status
 */
async function updateIMPOWRDatabase(phoneNumber, smsOptOutValue, context) {
    try {
        // Get database configuration from environment variables
        const impowrDbUrl = context.IMPOWR_DB_URL;
        const impowrDbApiKey = context.IMPOWR_DB_API_KEY;
        
        if (!impowrDbUrl || !impowrDbApiKey) {
            throw new Error('IMPOWR database configuration missing');
        }

        // Search for contact by phone number
        const searchResponse = await axios.get(`${impowrDbUrl}/contacts/search`, {
            params: { phone_number: phoneNumber },
            headers: {
                'Authorization': `Bearer ${impowrDbApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!searchResponse.data || !searchResponse.data.contacts || searchResponse.data.contacts.length === 0) {
            console.warn(`No contact found for phone number: ${phoneNumber}`);
            return { success: false, reason: 'contact_not_found' };
        }

        const contact = searchResponse.data.contacts[0];
        const contactId = contact.id;

        // Update the contact's SMS opt-out status
        const updateResponse = await axios.patch(`${impowrDbUrl}/contacts/${contactId}`, {
            sms_opt_out: smsOptOutValue,
            sms_opt_out_updated_at: new Date().toISOString()
        }, {
            headers: {
                'Authorization': `Bearer ${impowrDbApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Successfully updated contact ${contactId} with sms_opt_out: ${smsOptOutValue}`);
        
        return { 
            success: true, 
            contactId,
            smsOptOutValue,
            updatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error updating IMPOWR database:', error);
        throw error;
    }
}

/**
 * Log webhook event to secondary logging database
 */
async function logWebhookEvent(eventData, context) {
    try {
        const loggingDbUrl = context.LOGGING_DB_URL;
        const loggingDbApiKey = context.LOGGING_DB_API_KEY;
        
        if (!loggingDbUrl || !loggingDbApiKey) {
            console.warn('Logging database configuration missing, skipping log');
            return;
        }

        await axios.post(`${loggingDbUrl}/webhook-events`, eventData, {
            headers: {
                'Authorization': `Bearer ${loggingDbApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Webhook event logged successfully');

    } catch (error) {
        console.error('Error logging webhook event:', error);
        // Don't throw here - logging failure shouldn't break the webhook
    }
}
