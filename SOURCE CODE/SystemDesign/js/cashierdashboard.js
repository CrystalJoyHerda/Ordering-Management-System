// Helper function for API responses
async function handleApiResponse(response) {
    if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        
        // Get response as text first to debug
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        try {
            // Try to parse as JSON
            const error = JSON.parse(responseText);
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        } catch (e) {
            // If parsing fails, it's not valid JSON
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }
    
    // Get response as text first to debug
    const responseText = await response.text();
    console.log("Raw success response:", responseText);
    
    try {
        // Try to parse as JSON
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error("Invalid JSON response from server");
    }
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cashier dashboard loaded');
    
    // Check if RBAC service is available
    if (typeof RBACService !== 'undefined') {
        // Enforce cashier-only access to this page
        RBACService.enforcePageAccess('cashier');
        
        // Get user data and display name
        const userData = RBACService.getUserData();
        if (userData) {
            const cashierNameElement = document.getElementById('cashier-name');
            if (cashierNameElement) {
                cashierNameElement.textContent = userData.name;
            }
        }    } else {
        // Fallback to basic authentication if RBAC is not available
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Not logged in, redirect to login
            window.location.href = '../pages/loginInterface.html';
            return;
        }
        
        try {
            // Decode token to get user data
            const payload = token.split('.')[1];
            const userData = JSON.parse(atob(payload));
            const user = userData.data;
            
            if (user.role !== 'cashier') {
                // Not a cashier, redirect to appropriate dashboard
                if (user.role === 'admin') {
                    window.location.href = 'admindashboard.html';
                } else {
                    window.location.href = '../loginInterface.html';
                }
                return;
            }
            
            // User is cashier, continue loading cashier dashboard
            // Display cashier name if element exists
            const cashierNameElement = document.getElementById('cashier-name');
            if (cashierNameElement) {
                cashierNameElement.textContent = user.name;
            }
        } catch (e) {
            // Invalid token, redirect to login
            console.error('Token validation error:', e);
            localStorage.removeItem('auth_token');
            window.location.href = '../loginInterface.html';
            return;
        }
    }
      // Load dashboard data
    loadDashboardData();

    // Add event listeners
    document.querySelector('.logout-btn').addEventListener('click', function() {
        // Use shared logout helper if available, otherwise fall back to local implementation
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            handleLogoutFallback();
        }
    });
    
    // Make sidebar links highlight on click
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
});

// Function to load dashboard data
async function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    try {
        // Example: fetch recent sales or other data
        const apiUrl = 'http://localhost/SOURCE_CODE/Employee/public/api/dashboard.php';
        
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Accept': 'application/json'
        };
        
        // Add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });
        
        const data = await handleApiResponse(response);
        
        if (data.status === 'success') {
            // Update the dashboard with the data
            updateDashboardUI(data.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Handle error in UI
    }
}

// Function to update the dashboard UI with data
function updateDashboardUI(data) {
    // Update any metrics or tables in the dashboard
    console.log('Updating dashboard with data:', data);
    
    // Example: Update the current date/time
    const now = new Date();
    const dateTimeElement = document.querySelector('.date-time');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString();
    }
    
    // Additional UI updates can be added here
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear JWT token and user data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Attempt to call server-side logout
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
            // Continue with logout regardless of API result
        }).finally(() => {
            // Redirect to login page
            const pathname = window.location.pathname.toLowerCase();
            
            if (pathname.includes('/pages/')) {
                // We're in the pages directory
                window.location.href = 'loginInterface.html';
            } else {
                // We're in the root directory
                window.location.href = 'pages/loginInterface.html';
            }
        });
    }
}

// Fallback logout function if the shared handler is not available
function handleLogoutFallback() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear JWT token and user data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Attempt to call server-side logout
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
            // Continue with logout regardless of API result
        }).finally(() => {
            // Redirect to login page using path detection
            const pathname = window.location.pathname.toLowerCase();
            
            if (pathname.includes('/pages/')) {
                // We're in the pages directory
                window.location.href = 'loginInterface.html';
            } else {
                // We're in the root directory
                window.location.href = 'pages/loginInterface.html';
            }
        });
    }
}

// Update sidebar active state
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        this.parentElement.classList.add('active');
    });
});
