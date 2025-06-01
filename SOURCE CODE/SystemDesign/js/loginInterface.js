/**
 * Login Interface Controller
 * Handles login form submission and authentication
 */

// Update API configuration to use the exact working URL

// Port configuration - Default to standard HTTP port 80 for backend
const FRONTEND_PORT = '8000'; 
const BACKEND_PORT = '80';

// Live Server ports
const LIVE_SERVER_PORTS = ['5500', '5501'];

// Primary API path - Use exactly what works
const PRIMARY_API_PATH = '/SOURCE_CODE/Employee/public/api';

// Check if running under Live Server or other development server
const isLiveServer = LIVE_SERVER_PORTS.includes(window.location.port);
const isCustomFrontend = window.location.port === FRONTEND_PORT;
const isDevServer = isLiveServer || isCustomFrontend;

// For development servers, we need to use the full URL with proper backend port
const API_FULL_URL = isDevServer 
    ? `http://127.0.0.1${PRIMARY_API_PATH}` // Use 127.0.0.1 to match origin
    : PRIMARY_API_PATH;

// Log configuration on startup
console.log('Environment:', isLiveServer ? 'Live Server' : (isCustomFrontend ? 'Custom Frontend' : 'Production'));
console.log('API endpoint:', API_FULL_URL + '/auth.php');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login interface initialized');
    
    // Get form elements
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-button');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    
    // Check if already logged in
    if (localStorage.getItem('auth_token')) {
        // Get user info from the token
        const userData = AuthService.getUserInfo();
        if (userData) {
            console.log('User already logged in, redirecting to dashboard');
            redirectBasedOnRole(userData);
        }
    }
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        // Clear error and show loading state
        clearError();
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginButton.disabled = true;
        
        try {
            // Use 127.0.0.1 instead of localhost to match origin
            const apiUrl = `${API_FULL_URL}/auth.php`;
            console.log(`Attempting login at: ${apiUrl}`);
            console.log('Login data:', { name: username, password: '***' });

            // Create form data
            const formData = new FormData();
            formData.append('name', username);
            formData.append('password', password);

            // Send the request
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            // Log the raw response for debugging
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Try to parse the response as JSON
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error('Invalid server response');
            }

            if (responseData.status === 'success' && responseData.token) {
                // Store JWT token
                localStorage.setItem('auth_token', responseData.token);
                // Store user data
                localStorage.setItem('user_data', JSON.stringify(responseData.data));
                
                console.log('Login successful! User data:', responseData.data);
                
                // Add success message to UI
                showSuccess('Login successful! Redirecting...');
                
                // Wait a moment before redirecting for better UX
                setTimeout(() => {
                    redirectBasedOnRole(responseData.data);
                }, 800);
            } else {
                showError(responseData.message || 'Login failed');
                // Show forgot password link only on wrong password
                forgotPasswordLink.style.display = responseData.message.includes('password') ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please try again.');
        } finally {
            loginButton.innerHTML = 'Login';
            loginButton.disabled = false;
        }
    });

    // Add success message function
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.className = 'success-message';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.className = 'error-message';
    }
    
    function clearError() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        errorMessage.className = 'error-message';
    }
    
    // Disable submit on Enter in password field (use the button instead)
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginButton.click();
        }
    });
});

/**
 * Redirect user to appropriate dashboard based on role
 */
function redirectBasedOnRole(userData) {
    console.log('Redirecting based on role:', userData);
    
    // Extract role directly from the userData object
    let role = userData?.role?.toLowerCase() || null;
    console.log('Detected user role:', role);
    
    // Get current path to determine the correct relative path
    const currentPath = window.location.pathname.toLowerCase();
    let basePath = '';
    
    // If we're in the pages directory, we don't need to add it to the path
    if (!currentPath.includes('/pages/')) {
        basePath = 'pages/';
    }
    
    // Simple direct redirection based on role
    if (role === 'admin') {
        console.log('Redirecting to admin dashboard...');
        window.location.href = `${basePath}adminDashboard.html`;
    } 
    else if (role === 'cashier') {
        console.log('Redirecting to cashier dashboard...');
        window.location.href = `${basePath}cashierdashboard.html`;
    }
    else if (role === 'inventory') {
        console.log('Redirecting to inventory dashboard...');
        window.location.href = `${basePath}inventory.html`;
    }
    else {
        console.error('Unknown role:', role);
        showError('Invalid user role. Please contact administrator.');
    }
}

// Global redirect function for use in the HTML
window.redirectToDashboard = redirectBasedOnRole;