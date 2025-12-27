const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { execSync } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

// Get Git Commit Info
let gitInfo = { 
    hash: 'Unknown', 
    date: 'Unknown' 
};

try {
    const hash = execSync('git log -1 --format="%h"').toString().trim();
    const date = execSync('git log -1 --format="%cd"').toString().trim();
    gitInfo = { hash, date };
} catch (e) {
    console.warn("Could not retrieve git info:", e.message);
}

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the "public" directory under the "/public" path
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve index.html from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoint for Version Info
app.get('/api/version', (req, res) => {
    res.json(gitInfo);
});

app.post('/api/test-smtp', async (req, res) => {
    const { host, port, secure, user, pass, from, to } = req.body;

    // Log intent
    console.log(
        `Attempting SMTP connection to ${host}:${port} (${secure ? "Secure" : "Insecure"
        }) for ${user}`
    );

    // Parse secure setting
    const isSecure = secure === true || secure === "true";
    const isNone = secure === "none";

    // Create Transporter
    const transporterConfig = {
        host: host,
        port: parseInt(port),
        secure: isSecure, // true for 465, false for other ports
        auth: {
            user: user,
            pass: pass,
        },
        tls: {
            rejectUnauthorized: false, // Default to allowing self-signed
        }
    };

    // Handle Unencrypted (Force Cleartext)
    if (isNone) {
        transporterConfig.ignoreTLS = true;
        delete transporterConfig.tls; // Remove TLS config for cleartext
    }

    try {
        const transporter = nodemailer.createTransport(transporterConfig);

        // 1. Verify Connection
        await transporter.verify();
        console.log("SMTP Connection Verified Successfully");

        // 2. Send Test Email
        const mailOptions = {
            from: from || user, // Default to user if from not specified
            to: to,
            subject: "SMTP Test - Advanced SMTP Tester",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 40px 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                                ✅ SMTP Test Successful
                                            </h1>
                                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400;">
                                                Your SMTP configuration is working perfectly!
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 0 40px 40px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                                <tr>
                                                    <td style="padding: 30px;">
                                                        <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 20px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                                                            📧 Test Configuration
                                                        </h2>
                                                        
                                                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Host:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${host}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Port:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${port}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Encryption:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #ffffff; font-size: 12px; font-weight: 600; background-color: ${secure === 'none' ? '#94a3b8' : (secure ? '#48bb78' : '#ed8936')}; padding: 4px 12px; border-radius: 12px;">${secure === 'none' ? '⚠️ Unencrypted' : (secure ? '🔒 SSL/TLS' : '🔓 STARTTLS')}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Username:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${user}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Password:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; text-align: right;">
                                                                    <span style="color: #c53030; font-family: 'Courier New', monospace; font-size: 14px; background-color: #fff5f5; padding: 6px 12px; border-radius: 6px; border: 1px solid #feb2b2; font-weight: 600;">${pass}</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        
                                                        <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #fef5e7 0%, #fdebd0 100%); border-left: 4px solid #f39c12; border-radius: 6px;">
                                                            <p style="margin: 0; color: #7d6608; font-size: 13px; line-height: 1.6;">
                                                                <strong>⚠️ Security Notice:</strong> The password is included in this email as per your request. Please ensure you're sending this to a secure mailbox.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 0 40px 40px; text-align: center;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 20px 0; text-align: center;">
                                                        <p style="margin: 0 0 15px; color: rgba(255,255,255,0.9); font-size: 14px;">
                                                            <strong>🚀 Need to test more configurations?</strong>
                                                        </p>
                                                        <a href="https://gitsmtp.beyondcloud.technology/" style="display: inline-block; margin: 0 5px 10px; padding: 12px 24px; background-color: #ffffff; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s;">
                                            Visit SMTP Tester
                                        </a>
                                                        <br>
                                                        <a href="https://github.com/DeNNiiInc/Advanced-Smtp-Tester" style="display: inline-block; margin: 5px 5px 0; padding: 10px 20px; background-color: rgba(255,255,255,0.2); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; border: 1px solid rgba(255,255,255,0.3);">
                                            ⭐ Star on GitHub
                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 20px 0 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">
                                                        <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">
                                                            Generated by <strong>Advanced SMTP Tester</strong><br>
                                                            © 2025 Beyond Cloud Technology. All rights reserved.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);

        res.json({
            success: true,
            message: "Connection verified and email sent successfully!",
            details: {
                messageId: info.messageId,
                response: info.response,
            },
        });
    } catch (error) {
        console.error("SMTP Error:", error);
        res.status(500).json({
            success: false,
            message: "SMTP Test Failed",
            error: error.message,
        });
    }
});

// Auto-Discovery Endpoint - Tests multiple port/encryption combinations
app.post('/api/auto-test-smtp', async (req, res) => {
    const { host, user, pass, from, to } = req.body;

    // Common SMTP port/encryption combinations to test
    const configurations = [
        { port: 587, secure: false, name: 'STARTTLS (587)', tls: true },
        { port: 465, secure: true, name: 'SSL/TLS (465)', tls: true },
        { port: 25, secure: false, name: 'STARTTLS (25)', tls: true },
        { port: 2525, secure: false, name: 'STARTTLS (2525)', tls: true },
        { port: 25, secure: false, name: 'Unencrypted (25)', tls: false },
        { port: 587, secure: false, name: 'Unencrypted (587)', tls: false },
        { port: 2525, secure: false, name: 'Unencrypted (2525)', tls: false },
    ];

    console.log(`Starting auto-discovery for ${host} with user ${user}`);

    const results = [];
    let successCount = 0;

    // Test each configuration
    for (const config of configurations) {
        console.log(`Testing ${config.name}...`);

        const transporterConfig = {
            host: host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: user,
                pass: pass,
            },
            connectionTimeout: 10000, // 10 second timeout
            greetingTimeout: 10000,
        };

        // Only add TLS settings if encryption is enabled
        if (config.tls !== false) {
            transporterConfig.tls = {
                rejectUnauthorized: false,
            };
        }

        try {
            const transporter = nodemailer.createTransport(transporterConfig);

            // Verify connection
            await transporter.verify();
            console.log(`✅ ${config.name} - Connection successful!`);

            // Send test email for this successful configuration
            const mailOptions = {
                from: from || user,
                to: to,
                subject: `SMTP Auto-Discovery: ${config.name} - SUCCESS`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 40px 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                                ✅ Auto-Discovery Success
                                            </h1>
                                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400;">
                                                Found a working SMTP configuration!
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 0 40px 40px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                                <tr>
                                                    <td style="padding: 30px;">
                                                        <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 20px; font-weight: 600; border-bottom: 2px solid #48bb78; padding-bottom: 10px;">
                                                            🔍 Discovered Configuration
                                                        </h2>
                                                        
                                                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Host:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${host}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Port:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${config.port}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Encryption:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #ffffff; font-size: 12px; font-weight: 600; background-color: ${config.tls === false ? '#94a3b8' : (config.secure ? '#48bb78' : '#ed8936')}; padding: 4px 12px; border-radius: 12px;">${config.tls === false ? '⚠️ Unencrypted' : (config.secure ? '🔒 SSL/TLS' : '🔓 STARTTLS')}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Username:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                                                    <span style="color: #2d3748; font-family: 'Courier New', monospace; font-size: 14px; background-color: #f7fafc; padding: 4px 8px; border-radius: 4px;">${user}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 12px 0;">
                                                                    <strong style="color: #4a5568; font-size: 14px;">Password:</strong>
                                                                </td>
                                                                <td style="padding: 12px 0; text-align: right;">
                                                                    <span style="color: #c53030; font-family: 'Courier New', monospace; font-size: 14px; background-color: #fff5f5; padding: 6px 12px; border-radius: 6px; border: 1px solid #feb2b2; font-weight: 600;">${pass}</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        
                                                        <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%); border-left: 4px solid #38b2ac; border-radius: 6px;">
                                                            <p style="margin: 0; color: #234e52; font-size: 13px; line-height: 1.6;">
                                                                <strong>🎉 Success!</strong> This configuration was automatically discovered and verified during the auto-test process.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 0 40px 40px; text-align: center;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 20px 0; text-align: center;">
                                                        <p style="margin: 0 0 15px; color: rgba(255,255,255,0.9); font-size: 14px;">
                                                            <strong>🚀 Need to test more configurations?</strong>
                                                        </p>
                                                        <a href="https://gitsmtp.beyondcloud.technology/" style="display: inline-block; margin: 0 5px 10px; padding: 12px 24px; background-color: #ffffff; color: #48bb78; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s;">
                                            Visit SMTP Tester
                                        </a>
                                                        <br>
                                                        <a href="https://github.com/DeNNiiInc/Advanced-Smtp-Tester" style="display: inline-block; margin: 5px 5px 0; padding: 10px 20px; background-color: rgba(255,255,255,0.2); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; border: 1px solid rgba(255,255,255,0.3);">
                                            ⭐ Star on GitHub
                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 20px 0 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">
                                                        <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">
                                                            Generated by <strong>Advanced SMTP Tester</strong><br>
                                                            © 2025 Beyond Cloud Technology. All rights reserved.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            };

            const info = await transporter.sendMail(mailOptions);
            successCount++;

            results.push({
                config: config.name,
                port: config.port,
                secure: config.secure,
                status: 'success',
                messageId: info.messageId,
            });

            console.log(`📧 Email sent for ${config.name}: ${info.messageId}`);
        } catch (error) {
            console.log(`❌ ${config.name} - Failed: ${error.message}`);
            results.push({
                config: config.name,
                port: config.port,
                secure: config.secure,
                status: 'failed',
                error: error.message,
            });
        }
    }

    // Return summary of all tests
    res.json({
        success: true,
        message: `Auto-discovery complete. Found ${successCount} working configuration(s).`,
        totalTests: configurations.length,
        successfulConfigs: successCount,
        results: results,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message || "Unknown error occurred"
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
