/**
 * Admin Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');
    
    // Display admin name from auth data
    const userData = AuthService.getUserInfo();
    if (userData && userData.name) {
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = userData.name;
        }
    }
    
    // Initialize sidebar navigation
    initializeSidebar();
    
    // Initialize logout modal
    initializeLogoutModal();
      // Add logout button event listener
    const logoutBtn = document.querySelector('.logout-btn');
    console.log('Logout button found:', logoutBtn);
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            console.log('Logout button clicked');
            e.preventDefault(); // Prevent any default behavior
            e.stopPropagation(); // Stop event bubbling
            showLogoutModal();
        });
    } else {
        console.error('Logout button not found!');
    }
    
    function initializeSidebar() {
        // Highlight current page in sidebar
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.parentElement.classList.add('active');
            } else {
                link.parentElement.classList.remove('active');
            }
        });
    }
});

// Initialize logout modal functionality
function initializeLogoutModal() {
    console.log('Initializing logout modal');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    
    console.log('Modal elements:', { logoutModal, confirmLogoutBtn, cancelLogoutBtn });

    // Check if modal elements exist
    if (!logoutModal || !confirmLogoutBtn || !cancelLogoutBtn) {
        console.error('Logout modal elements not found');
        return;
    }
    
    // Confirm logout
    confirmLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideLogoutModal();
        handleLogout();
    });
    
    // Cancel logout
    cancelLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideLogoutModal();
    });
    
    // Close modal when clicking outside
    logoutModal.addEventListener('click', function(e) {
        if (e.target === logoutModal) {
            hideLogoutModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal.classList.contains('show')) {
            hideLogoutModal();
        }
    });
}

// Show logout modal
function showLogoutModal() {
    console.log('showLogoutModal called');
    const logoutModal = document.getElementById('logout-modal');
    console.log('Logout modal element:', logoutModal);
    if (logoutModal) {
        logoutModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('Modal should now be visible');
    } else {
        console.error('Logout modal element not found!');
    }
}

// Hide logout modal
function hideLogoutModal() {
    const logoutModal = document.getElementById('logout-modal');
    if (logoutModal) {
        logoutModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Handle logout - Uses shared logout helper
function handleLogout() {
    // Use shared logout function if available
    if (typeof window.performLogout === 'function') {
        window.performLogout();
    } else {
        // Fallback implementation
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('user');
        
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
        }).finally(() => {
            const pathname = window.location.pathname.toLowerCase();
            
            if (pathname.includes('/pages/')) {
                window.location.href = 'loginInterface.html';
            } else {
                window.location.href = 'pages/loginInterface.html';
            }
        });
    }
}