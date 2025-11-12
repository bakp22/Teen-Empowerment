const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API endpoint to run tests
app.get('/api/run-tests', async (req, res) => {
    const testType = req.query.type || 'all';
    
    try {
        const results = await runTestSuite(testType);
        res.json(results);
    } catch (error) {
        console.error('Error running tests:', error);
        res.status(500).json({ 
            error: error.message,
            results: []
        });
    }
});

async function runTestSuite(testType) {
    const results = [];
    
    try {
        // Run keywords test
        if (testType === 'keywords' || testType === 'all') {
            try {
                const { stdout, stderr } = await execAsync('node test-keywords.js', { cwd: __dirname });
                const output = stdout + stderr;
                const keywordResults = parseKeywordTests(output);
                results.push(keywordResults);
            } catch (error) {
                results.push({
                    title: 'Keyword Detection Tests',
                    description: 'Testing OPT IN and OPT OUT keyword recognition',
                    status: 'error',
                    passed: 0,
                    failed: 1,
                    total: 1,
                    console: error.message
                });
            }
        }
        
        // Run webhook test  
        if (testType === 'webhook' || testType === 'all') {
            try {
                const { stdout, stderr } = await execAsync('node test-webhook-mock.js', { cwd: __dirname });
                const output = stdout + stderr;
                const webhookResults = parseWebhookTests(output);
                results.push(webhookResults);
            } catch (error) {
                results.push({
                    title: 'Webhook Functionality Tests',
                    description: 'Testing SMS webhook processing and database updates',
                    status: 'error',
                    passed: 0,
                    failed: 1,
                    total: 1,
                    console: error.message
                });
            }
        }
    } catch (error) {
        console.error('Test suite error:', error);
    }
    
    return {
        testType,
        timestamp: new Date().toISOString(),
        results
    };
}

function parseKeywordTests(output) {
    const lines = output.split('\n');
    let passedCount = 0;
    let failedCount = 0;
    const individualResults = [];
    
    // Parse test results
    lines.forEach(line => {
        const testMatch = line.match(/^([✅❌]) Test (\d+): (.+)$/);
        if (testMatch) {
            const isSuccess = testMatch[1] === '✅';
            if (isSuccess) passedCount++;
            else failedCount++;
            
            individualResults.push({
                test: `Test ${testMatch[2]}`,
                description: testMatch[3],
                status: isSuccess ? 'success' : 'error'
            });
        }
    });
    
    // Count phone tests too
    lines.forEach(line => {
        const phoneMatch = line.match(/^([✅❌]) Phone Test (\d+): (.+)$/);
        if (phoneMatch) {
            const isSuccess = phoneMatch[1] === '✅';
            if (isSuccess) passedCount++;
            else failedCount++;
        }
    });
    
    // Extract summary
    const summaryMatch = output.match(/✅ Passed: (\d+)\/(\d+)/);
    
    return {
        title: 'Keyword Detection Tests',
        description: 'Testing OPT IN/OPT OUT keywords and phone number normalization',
        status: failedCount === 0 ? 'success' : 'error',
        passed: passedCount,
        failed: failedCount,
        total: passedCount + failedCount,
        console: output,
        details: `Results: ${passedCount} passed, ${failedCount} failed`
    };
}

function parseWebhookTests(output) {
    const lines = output.split('\n');
    let passedCount = 0;
    let failedCount = 0;
    let currentTest = null;
    
    // Parse test results
    lines.forEach(line => {
        const testMatch = line.match(/^📱 Test \d+: (.+)$/);
        if (testMatch) {
            currentTest = testMatch[1];
        }
        
        // Check for success
        if (line.includes('✅ Status:') || line.includes('✅')) {
            passedCount++;
        }
        
        // Check for failure
        if (line.includes('❌ Status:') || line.includes('❌ Error:')) {
            failedCount++;
        }
    });
    
    // If we don't have counts, try alternative parsing
    if (passedCount === 0 && failedCount === 0) {
        const successMatches = output.match(/✅/g);
        const failureMatches = output.match(/❌/g);
        passedCount = successMatches ? successMatches.length : 0;
        failedCount = failureMatches ? failureMatches.length : 0;
    }
    
    return {
        title: 'Webhook Functionality Tests',
        description: 'Testing SMS webhook processing and mock database responses',
        status: failedCount === 0 ? 'success' : 'error',
        passed: passedCount,
        failed: failedCount,
        total: passedCount + failedCount,
        console: output,
        details: `Results: ${passedCount} passed, ${failedCount} failed`
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Dashboard server running at http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
});
