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
