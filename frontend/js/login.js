const API_URL = 'http://localhost:7845/api/v1';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Save token and username
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);

            // Redirect to dashboard (Changed from home.html)
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.textContent = data.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.classList.add('show');
        console.error('Error:', error);
    }
});
