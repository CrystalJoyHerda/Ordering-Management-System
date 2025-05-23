// Stocks page script with RBAC enforcement
document.addEventListener("DOMContentLoaded", function() {
    console.log("Stocks page loaded");
    
    // Check if RBAC service is available
    if (typeof RBACService !== 'undefined') {
        // Enforce that only admin and cashier can access this page
        RBACService.enforcePageAccess(['admin', 'cashier']);
    } else {
        console.error("RBAC service not loaded! Redirecting to login...");
        // Fallback if RBAC service is not available
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDir ? '../loginInterface.html' : 'pages/loginInterface.html';
        window.location.href = loginPath;
    }
    // Set up logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            } else {
                console.error("Logout helper not loaded!");
                // Fallback if logout helper is not loaded
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('user');
                
                // Redirect to login page
                const pathname = window.location.pathname.toLowerCase();
                
                if (pathname.includes('/pages/')) {
                    // We're in the pages directory
                    window.location.href = 'loginInterface.html';
                } else {
                    // We're in the root directory
                    window.location.href = 'pages/loginInterface.html';
                }
            }
        });
    }
    
    // Initialize page functionality
    loadStocksData();
});

function loadStocksData() {
    // Placeholder for stocks data loading
    console.log("Loading stocks data...");
    // This would be replaced with actual API calls to fetch stock data
}
