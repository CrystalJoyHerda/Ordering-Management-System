/**
 * Authentication Check Script
 * Include this file in all protected pages to automatically redirect 
 * unauthenticated users to the login page
 */

// Immediately executing function to check auth status
(function() {
    console.log("Auth check running...");
      // Function to get the login page path
    function getLoginPath() {
        const pathname = window.location.pathname.toLowerCase();
        
        if (pathname.includes('/pages/')) {
            // We're in the pages directory
            return 'loginInterface.html';
        } else if (pathname.includes('/logininterface.html')) {
            // Already on the login page
            return null;
        } else {
            // We're in the root directory
            return 'pages/loginInterface.html';
        }
    }
    
    // Skip auth check on login page
    if (window.location.pathname.toLowerCase().includes('logininterface.html')) {
        console.log("Already on login page, skipping auth check");
        return;
    }
    
    // Check if logged in by looking for a valid token
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.log("No auth token found, redirecting to login");
        const loginPath = getLoginPath();
        if (loginPath) {
            window.location.href = loginPath;
        }
        return;
    }
    
    // Validate token structure
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error("Invalid token format");
        }
        
        // Try to decode the payload
        const payload = JSON.parse(atob(parts[1]));
        if (!payload || !payload.data || !payload.data.role) {
            throw new Error("Token missing role information");
        }
        
        // Check token expiration if included
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new Error("Token expired");
        }
        
        console.log("Auth check passed for role:", payload.data.role);
    } catch (e) {
        console.error("Auth validation failed:", e);
        localStorage.removeItem('auth_token');
        const loginPath = getLoginPath();
        if (loginPath) {
            window.location.href = loginPath;
        }
    }
})();

/**
 * Auth Check - Ensures users are logged in before accessing protected pages
 */

// Execute immediately
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Auth check running...');
        
        // Make sure we're actually on a protected page
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('logininterface.html')) {
            console.log('On login page, no auth check needed');
            return;
        }
        
        // Check if user is logged in
        if (!localStorage.getItem('auth_token')) {
            console.error('No auth token found - redirecting to login');
            window.location.replace('loginInterface.html');
            return;
        }
        
        // Try to get user data directly from localStorage
        try {
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            console.log('User data from localStorage:', userData);
            
            if (!userData || !userData.role) {
                console.error('Invalid user data - redirecting to login');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                window.location.replace('loginInterface.html');
                return;
            }
            
            // Set user name in the UI
            const role = userData.role.toLowerCase();
            const userName = userData.name || 'User';
            
            if (role === 'admin') {
                const nameElement = document.getElementById('admin-name');
                if (nameElement) nameElement.textContent = userName;
            } else if (role === 'cashier') {
                const nameElement = document.getElementById('cashier-name');
                if (nameElement) nameElement.textContent = userName;
            }
            
            // Ensure user is on the correct page for their role
            const currentPage = window.location.pathname.split('/').pop().toLowerCase();
            
            if (role === 'admin' && currentPage.includes('cashier')) {
                window.location.replace('adminDashboard.html');
            } else if (role === 'cashier' && (currentPage.includes('admin') || currentPage.includes('manage'))) {
                window.location.replace('cashierdashboard.html');
            }
            
            console.log('Auth check passed for user:', userName);
        } catch (error) {
            console.error('Error in auth check:', error);
            window.location.replace('loginInterface.html');
        }
    });
})();
