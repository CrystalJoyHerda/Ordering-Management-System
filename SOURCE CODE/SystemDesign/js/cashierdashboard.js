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
    loadDashboardData();    // Add event listeners
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
    
    // Initialize logout modal
    initializeLogoutModal();
    
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
        // Use shared logout helper if available, otherwise fall back to local implementation
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            handleLogoutFallback();
        }
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

// Logout function - Uses shared logout helper
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

// Fallback logout function - Uses shared logout helper
function handleLogoutFallback() {
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

// Update sidebar active state
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        this.parentElement.classList.add('active');
    });
});
