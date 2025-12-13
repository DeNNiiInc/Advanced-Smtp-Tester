function togglePassword() {
    const passInput = document.getElementById('pass');
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
}

document.getElementById('smtpForm').addEventListener('submit', async function(e) {
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

        const result = await response.json();

        // Show Results
        resultsDiv.classList.remove('hidden');

        if (result.success) {
            statusDiv.classList.add('status-success');
            statusDiv.textContent = '✅ Success! Email Sent Successfully.';
            logOutput.textContent = JSON.stringify(result.details, null, 2);
        } else {
            statusDiv.classList.add('status-error');
            statusDiv.textContent = '❌ Error: ' + result.message;
            logOutput.textContent = result.error || 'Unknown error occurred.';
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Network Error';
        logOutput.textContent = error.toString();
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Test Configuration & Send Email';
    }
});

// Auto Discovery Test Handler
document.getElementById('autoTestBtn').addEventListener('click', async function() {
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
            logOutput.textContent = result.error || 'Unknown error occurred.';
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Network Error';
        logOutput.textContent = error.toString();
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = '🔍 Auto Discovery Test';
    }
});
