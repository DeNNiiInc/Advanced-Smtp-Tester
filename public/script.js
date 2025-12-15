// ===================================
// SMTP TESTER - ENHANCED SCRIPT
// Features: Presets, Dark Mode, History, Error Tips
// ===================================

// Configuration Presets
const PRESETS = {
    office365: {
        host: 'smtp.office365.com',
        port: '587',
        secure: 'false',
        name: 'Microsoft Office 365'
    },
    gmail: {
        host: 'smtp.gmail.com',
        port: '587',
        secure: 'false',
        name: 'Google Gmail'
    },
    sendgrid: {
        host: 'smtp.sendgrid.net',
        port: '587',
        secure: 'false',
        name: 'SendGrid'
    },
    mailgun: {
        host: 'smtp.mailgun.org',
        port: '587',
        secure: 'false',
        name: 'Mailgun'
    },
    amazonses: {
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: '587',
        secure: 'false',
        name: 'Amazon SES'
    }
};

// Error Messages with Troubleshooting Tips
const ERROR_TIPS = {
    'EAUTH': {
        title: 'Authentication Failed',
        tips: [
            'Verify your username and password are correct',
            'For Gmail: Enable "Less secure app access" or use an App Password',
            'For Office 365: Check if Modern Authentication is required',
            'Some providers require OAuth2 instead of password authentication'
        ]
    },
    'ECONNECTION': {
        title: 'Connection Failed',
        tips: [
            'Check if the SMTP host address is correct',
            'Verify the port number (587 for STARTTLS, 465 for SSL/TLS)',
            'Ensure your firewall isn\'t blocking the connection',
            'Try switching between STARTTLS and SSL/TLS encryption'
        ]
    },
    'ETIMEDOUT': {
        title: 'Connection Timeout',
        tips: [
            'The server took too long to respond',
            'Check your internet connection',
            'The SMTP server might be down or overloaded',
            'Try again in a few moments'
        ]
    },
    'ENOTFOUND': {
        title: 'Host Not Found',
        tips: [
            'Double-check the SMTP host address for typos',
            'Ensure you have an active internet connection',
            'The SMTP server might be temporarily unavailable'
        ]
    },
    'DEFAULT': {
        title: 'SMTP Error',
        tips: [
            'Review your SMTP configuration settings',
            'Check the error message for specific details',
            'Consult your email provider\'s documentation',
            'Try using the Auto Discovery feature'
        ]
    }
};

// ===================================
// THEME MANAGEMENT
// ===================================
const themeToggle = document.getElementById('themeToggle');
let currentTheme = 'dark';

async function initTheme() {
    // Load saved theme preference
    const savedTheme = await window.smtpDB.getPreference('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(currentTheme);
    }
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', async () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    await window.smtpDB.savePreference('theme', currentTheme);
});

// ===================================
// PRESET MANAGEMENT
// ===================================
const presetSelect = document.getElementById('presetSelect');

presetSelect.addEventListener('change', async function () {
    const presetKey = this.value;

    if (!presetKey) return;

    if (presetKey === 'custom') {
        // Load last used configuration
        const settings = await window.smtpDB.getSettings();
        if (settings) {
            loadConfigToForm(settings);
        }
    } else if (PRESETS[presetKey]) {
        loadConfigToForm(PRESETS[presetKey]);
    }

    // Reset selector
    setTimeout(() => {
        this.value = '';
    }, 100);
});

function loadConfigToForm(config) {
    if (config.host) document.getElementById('host').value = config.host;
    if (config.port) document.getElementById('port').value = config.port;
    if (config.secure !== undefined) document.getElementById('secure').value = config.secure;
    if (config.user) document.getElementById('user').value = config.user;
    if (config.pass) document.getElementById('pass').value = config.pass;
    if (config.from) document.getElementById('from').value = config.from;
    if (config.to) document.getElementById('to').value = config.to;
}

// ===================================
// HISTORY MANAGEMENT
// ===================================
async function loadHistory() {
    const history = await window.smtpDB.getHistory();
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No test history yet. Run a test to see it here!</div>';
        return;
    }

    historyList.innerHTML = history.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString();
        const statusClass = item.success ? 'success' : 'error';
        const statusText = item.success ? '✅ Success' : '❌ Failed';

        return `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-item-host">${item.host}:${item.port}</span>
                    <span class="history-item-time">${timeStr}</span>
                </div>
                <div class="history-item-details">
                    <span class="history-item-status ${statusClass}">${statusText}</span>
                    <span>${item.secure === 'true' ? 'SSL/TLS' : (item.secure === 'false' ? 'STARTTLS' : 'Unencrypted')}</span>
                    <span>${item.user}</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to load history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', async function () {
            const id = parseInt(this.dataset.id);
            const history = await window.smtpDB.getHistory();
            const historyItem = history.find(h => h.id === id);
            if (historyItem) {
                loadConfigToForm(historyItem);
            }
        });
    });
}

// Clear history button
document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all test history?')) {
        await window.smtpDB.clearHistory();
        await loadHistory();
    }
});

// ===================================
// ERROR HANDLING
// ===================================
function getErrorTips(errorMessage) {
    for (const [code, info] of Object.entries(ERROR_TIPS)) {
        if (errorMessage.includes(code)) {
            return info;
        }
    }
    return ERROR_TIPS.DEFAULT;
}

function displayErrorWithTips(errorMessage, container) {
    const tips = getErrorTips(errorMessage);

    const tipsHTML = `
        <div class="error-tips">
            <div class="error-tips-title">💡 ${tips.title}</div>
            <ul>
                ${tips.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;

    container.innerHTML = errorMessage + tipsHTML;
}

// ===================================
// PASSWORD TOGGLE
// ===================================
function togglePassword() {
    const passInput = document.getElementById('pass');
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
}

// ===================================
// FORM SUBMISSION
// ===================================
document.getElementById('smtpForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('testBtn');
    const spinner = btn.querySelector('.loading-spinner');
    const btnText = btn.querySelector('.btn-text');
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('statusMessage');
    const logOutput = document.getElementById('logOutput');

    // Reset UI
    resultsDiv.classList.add('hidden');
    statusDiv.className = 'status-message';
    statusDiv.textContent = '';
    logOutput.textContent = '';

    // Set Loading State
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Testing...';

    // Get Form Data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/test-smtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || errorResult.error || "Server Error");
            } else {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}...`);
            }
        }

        const result = await response.json();

        // Show Results
        resultsDiv.classList.remove('hidden');

        if (result.success) {
            statusDiv.classList.add('status-success');
            statusDiv.textContent = '✅ Success! Email Sent Successfully.';
            logOutput.textContent = JSON.stringify(result.details, null, 2);

            // Save to history
            await window.smtpDB.saveTest({
                ...data,
                success: true,
                messageId: result.details.messageId
            });

            // Save as last used configuration
            await window.smtpDB.saveSettings(data);

            // Reload history
            await loadHistory();
        } else {
            statusDiv.classList.add('status-error');
            statusDiv.textContent = '❌ Error: ' + result.message;
            displayErrorWithTips(result.error || 'Unknown error occurred.', logOutput);

            // Save failed test to history
            await window.smtpDB.saveTest({
                ...data,
                success: false,
                error: result.error
            });

            await loadHistory();
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Error Caught';
        displayErrorWithTips(error.message, logOutput);

        // Save failed test to history
        await window.smtpDB.saveTest({
            ...data,
            success: false,
            error: error.message
        });

        await loadHistory();
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Test Configuration & Send Email';
    }
});

// ===================================
// AUTO DISCOVERY
// ===================================
document.getElementById('autoTestBtn').addEventListener('click', async function () {
    const btn = document.getElementById('autoTestBtn');
    const spinner = btn.querySelector('.loading-spinner');
    const btnText = btn.querySelector('.btn-text');
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('statusMessage');
    const logOutput = document.getElementById('logOutput');

    // Get form data
    const form = document.getElementById('smtpForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Only need host, user, pass, from, to for auto test
    const autoTestData = {
        host: data.host,
        user: data.user,
        pass: data.pass,
        from: data.from,
        to: data.to
    };

    // Reset UI
    resultsDiv.classList.add('hidden');
    statusDiv.className = 'status-message';
    statusDiv.textContent = '';
    logOutput.textContent = '';

    // Set Loading State
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Testing All Configurations...';

    try {
        const response = await fetch('/api/auto-test-smtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(autoTestData),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || errorResult.error || "Server Error");
            } else {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}...`);
            }
        }

        const result = await response.json();

        // Show Results
        resultsDiv.classList.remove('hidden');

        if (result.success) {
            statusDiv.classList.add('status-success');
            statusDiv.textContent = `✅ ${result.message}`;

            // Format detailed results
            let detailedOutput = `Total Tests: ${result.totalTests}\n`;
            detailedOutput += `Successful: ${result.successfulConfigs}\n`;
            detailedOutput += `Failed: ${result.totalTests - result.successfulConfigs}\n\n`;
            detailedOutput += '─'.repeat(50) + '\n\n';

            result.results.forEach((test, index) => {
                detailedOutput += `Test ${index + 1}: ${test.config}\n`;
                detailedOutput += `  Port: ${test.port}\n`;
                detailedOutput += `  Encryption: ${test.secure ? 'SSL/TLS' : 'STARTTLS'}\n`;
                detailedOutput += `  Status: ${test.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}\n`;

                if (test.status === 'success') {
                    detailedOutput += `  Email Sent: ${test.messageId}\n`;
                } else {
                    detailedOutput += `  Error: ${test.error}\n`;
                }

                detailedOutput += '\n';
            });

            logOutput.textContent = detailedOutput;
        } else {
            statusDiv.classList.add('status-error');
            statusDiv.textContent = '❌ Error: ' + result.message;
            displayErrorWithTips(result.error || 'Unknown error occurred.', logOutput);
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Error Caught';
        displayErrorWithTips(error.message, logOutput);
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = '🔍 Auto Discovery Test';
    }
});

// ===================================
// INITIALIZATION
// ===================================
window.addEventListener('DOMContentLoaded', async () => {
    // Wait for database to initialize
    await window.smtpDB.init();

    // Initialize theme
    await initTheme();

    // Load history
    await loadHistory();

    // Load last used configuration
    const settings = await window.smtpDB.getSettings();
    if (settings) {
        // Optionally auto-load last config
        // loadConfigToForm(settings);
    }
});
