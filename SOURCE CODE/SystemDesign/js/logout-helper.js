/**
 * Logout Helper Script
 * Provides a shared logout handler that uses modals when available,
 * falls back to confirm dialog when modals are not present
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if this page has its own logout modal system
    const logoutModal = document.getElementById('logout-modal');
    
    // Only attach logout helper event handler if there's no modal system
    // (modal-enabled pages will handle logout via their own JS files)
    if (!logoutModal) {
        const logoutBtn = document.querySelector('.logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Fallback to confirm dialog for pages without modals
                if (confirm('Are you sure you want to logout?')) {
                    performLogout();
                }
            });
        }
    }
});

/**
 * Shared logout function that handles the actual logout process
 */
function performLogout() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user');
    
    // Attempt to call server-side logout
    fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
        method: 'GET'
    }).catch(error => {
        console.error('Logout API error:', error);
        // Continue with logout regardless of API result
    }).finally(() => {
        // Redirect to login page with path detection
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

// Make the logout function globally available
window.performLogout = performLogout;
