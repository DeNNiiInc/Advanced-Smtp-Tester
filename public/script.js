function togglePassword() {
    const passInput = document.getElementById('pass');
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
}

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
            // Handle non-200 responses
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
        } else {
            // This block handles cases where response was 200 OK but success is false (business logic error)
            statusDiv.classList.add('status-error');
            statusDiv.textContent = '❌ Error: ' + result.message;
            logOutput.textContent = result.error || 'Unknown error occurred.';
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Error Caught'; // Changed from "Network Error" to be more accurate
        logOutput.textContent = error.message; // Use error.message instead of error.toString()
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Test Configuration & Send Email';
    }
});

// Auto Discovery Test Handler
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
            logOutput.textContent = result.error || 'Unknown error occurred.';
        }

    } catch (error) {
        resultsDiv.classList.remove('hidden');
        statusDiv.classList.add('status-error');
        statusDiv.textContent = '❌ Error Caught';
        logOutput.textContent = error.message;
    } finally {
        // Reset Button
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = '🔍 Auto Discovery Test';
    }
});
