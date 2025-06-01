/**
 * Logout Helper Script
 * Provides a shared logout handler that uses modals when available,
 * falls back to confirm dialog when modals are not present
 */

document.addEventListener('DOMContentLoaded', function() {
    const logoutModal = document.getElementById('logout-modal');
    const logoutBtn = document.querySelector('.logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');

    // Show modal when logout button is clicked
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // ONLY show the modal - no redirect yet
            logoutModal.style.display = 'flex';
            logoutModal.style.opacity = '1';
            logoutModal.style.visibility = 'visible';
        });
    }

    // Handle confirm logout - only logout when explicitly confirmed
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // First hide the modal
            logoutModal.style.display = 'none';
            
            // Only perform actual logout after confirmation
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            sessionStorage.removeItem('user');
            
            // Call server-side logout and redirect
            fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
                method: 'GET'
            }).catch(error => {
                console.error('Logout API error:', error);
            }).finally(() => {
                // Only redirect after explicit confirmation
                const pathname = window.location.pathname.toLowerCase();
                
                if (pathname.includes('/pages/')) {
                    // We're in the pages directory
                    window.location.href = 'loginInterface.html';
                } else {
                    // We're in the root directory
                    window.location.href = 'pages/loginInterface.html';
                }
            });
        });
    }

    // Just close modal when cancel button is clicked - no logout
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });
    }

    // Just close modal when clicking outside - no logout
    if (logoutModal) {
        window.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    }
});

/**
 * Global logout function - show modal instead of immediate logout
 */
function performLogout() {
    const logoutModal = document.getElementById('logout-modal');
    if (logoutModal) {
        // Always show confirmation modal first
        logoutModal.style.display = 'flex';
    } else {
        // Fallback if modal doesn't exist
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            sessionStorage.removeItem('user');
            
            const pathname = window.location.pathname.toLowerCase();
            window.location.href = pathname.includes('/pages/') ? 
                'loginInterface.html' : 'pages/loginInterface.html';
        }
    }
}

// Make the logout function globally available
window.performLogout = performLogout;
