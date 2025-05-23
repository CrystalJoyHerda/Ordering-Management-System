// Admin Dashboard JS - without product management (moved to inventory)

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard loaded');
    
    // Check if RBAC service is available
    if (typeof RBACService !== 'undefined') {
        // Enforce admin-only access to this page
        RBACService.enforcePageAccess('admin');
        
        // Get user data and display name
        const userData = RBACService.getUserData();
        if (userData) {
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = userData.name;
            }
        }
    } else {
        // Fallback to basic authentication if RBAC is not available
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Not logged in, redirect to login
            window.location.href = '../loginInterface.html';
            return;
        }
        
        try {
            // Decode token to get user data
            const payload = token.split('.')[1];
            const userData = JSON.parse(atob(payload));
            const user = userData.data;
            
            if (user.role !== 'admin') {
                // Not an admin, redirect to appropriate dashboard
                if (user.role === 'cashier') {
                    window.location.href = 'cashierdashboard.html';
                } else {
                    window.location.href = '../loginInterface.html';
                }
                return;
            }
            
            // User is admin, continue loading admin dashboard
            // Display admin name if element exists
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = user.name;
            }
        } catch (e) {
            // Invalid token, redirect to login
            console.error('Token validation error:', e);
            localStorage.removeItem('auth_token');
            window.location.href = '../loginInterface.html';
            return;
        }
    }
    
    // Add logout button listener
    document.querySelector('.logout-btn').addEventListener('click', function() {
        // Use shared logout helper if available, otherwise fall back to local implementation
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            handleLogoutFallback();
        }
    });
    
    // Initialize dashboard components
    initializeDashboard();
});

// Initialize dashboard components
function initializeDashboard() {
    // Here you would add code to initialize dashboard widgets
    // such as statistics, summary data, charts, etc.
    console.log('Initializing dashboard components');
    
    // Example: fetch and display some basic statistics
    // fetchDashboardStatistics();
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