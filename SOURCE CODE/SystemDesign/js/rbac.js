/**
 * Role-Based Access Control (RBAC) utility for the Ordering Management System
 * This file provides helpers for checking user roles and permissions
 */

// Check if RBACService is already defined to avoid duplicate declarations
if (typeof RBACService === 'undefined') {
    console.log("Initializing RBAC service");
    
    // RBAC (Role-Based Access Control) Service
    const RBACService = {
        // Store user roles and permissions
        roles: {
            admin: {
                permissions: ['read', 'write', 'delete', 'manage_users', 'view_reports'],
                dashboard: '../pages/adminDashboard.html'
            },
            cashier: {
                permissions: ['read', 'write', 'process_orders'],
                dashboard: '../pages/cashierInterface.html'
            },
            inventory: {
                permissions: ['read', 'write', 'manage_inventory'],
                dashboard: '../pages/inventoryInterface.html'
            }
        },
        
        /**
         * Get user role from JWT token
         * @returns {string|null} User role or null if not authenticated
         */
        getUserRole: function() {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;
            
            try {
                const payload = token.split('.')[1];
                const userData = JSON.parse(atob(payload));
                return userData.data.role;
            } catch (e) {
                console.error('Error extracting role from token:', e);
                return null;
            }
        },
        
        /**
         * Get user data from JWT token
         * @returns {object|null} User data or null if not authenticated
         */
        getUserData: function() {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;
            
            try {
                const payload = token.split('.')[1];
                const userData = JSON.parse(atob(payload));
                return userData.data;
            } catch (e) {
                console.error('Error extracting user data from token:', e);
                return null;
            }
        },
        
        /**
         * Check if current user has a specific role
         * @param {string} role - Role to check
         * @returns {boolean} Whether user has the role
         */
        hasRole: function(role) {
            const userRole = this.getUserRole();
            return userRole === role;
        },
        
        /**
         * Check if current user has access to a specific resource
         * @param {string} resource - Resource to check access for
         * @returns {boolean} Whether user has access
         */
        canAccess: function(resource) {
            const userRole = this.getUserRole();
            if (!userRole || !this.roles[userRole]) return false;
            
            return this.roles[userRole].canAccess.includes(resource);
        },
        
        /**
         * Check if one role has higher privileges than another
         * @param {string} roleA - First role
         * @param {string} roleB - Second role
         * @returns {boolean} Whether roleA has higher privileges than roleB
         */
        isRoleHigherThan: function(roleA, roleB) {
            if (!this.roles[roleA] || !this.roles[roleB]) return false;
            return this.roles[roleA].level > this.roles[roleB].level;
        },
          /**
         * Redirect to appropriate dashboard based on role
         */    redirectToDashboard: function() {
            const role = this.getUserRole();
            console.log("RBAC redirecting user with role:", role);
            
            if (!role) {
                // Not logged in
                console.log("No role found, redirecting to login");
                
                // Get current path to determine the correct relative path
                const pathname = window.location.pathname.toLowerCase();
                let loginPath;
                
                if (pathname.includes('/pages/')) {
                    // We're in the pages directory
                    loginPath = '../loginInterface.html';
                } else if (pathname.includes('/logininterface.html')) {
                    // Already on the login page
                    return;
                } else {
                    // We're in the root directory
                    loginPath = 'loginInterface.html';
                }
                
                console.log("Redirecting to login page:", loginPath);
                window.location.href = loginPath;
                return;
            }
            
            // Determine dashboard URL based on role
            let dashboardPath;
            switch(role) {
                case 'admin':
                    dashboardPath = 'admindashboard.html';
                    break;
                case 'cashier':
                    dashboardPath = 'cashierdashboard.html';
                    break;
                case 'manager':
                    // If you add a manager dashboard in the future
                    dashboardPath = 'managerdashboard.html';
                    break;
                default:
                    // Fallback for any other role
                    dashboardPath = 'dashboard.html';
                    break;
            }
            
            // Get current path to determine the correct relative path
            const pathname = window.location.pathname.toLowerCase();
            let fullPath;
            
            if (pathname.includes('/pages/')) {
                // We're in the pages directory
                fullPath = dashboardPath;
            } else if (pathname.includes('/logininterface.html')) {
                // We're at the login page in the root
                fullPath = 'pages/' + dashboardPath;
            } else {
                // We're somewhere else in the root
                fullPath = 'pages/' + dashboardPath;
            }
            
            console.log("RBAC redirecting to:", fullPath);
            window.location.href = fullPath;
        },    /**
         * Check if user has permission to access current page and redirect if not
         * @param {string|string[]} allowedRoles - Role(s) allowed to access the page
         */    
        enforcePageAccess: function(allowedRoles) {
            const userRole = this.getUserRole();
            console.log("Enforcing page access for role:", userRole);
            
            // Not logged in
            if (!userRole) {
                console.log("No user role, redirecting to login");
                
                // Get current path to determine the correct relative path
                const pathname = window.location.pathname.toLowerCase();
                let loginPath;
                
                if (pathname.includes('/pages/')) {
                    // We're in the pages directory
                    loginPath = '../loginInterface.html';
                } else if (pathname.includes('/logininterface.html')) {
                    // Already on the login page
                    return;
                } else {
                    // We're in the root directory
                    loginPath = 'loginInterface.html';
                }
                
                console.log("Redirecting to login page:", loginPath);
                window.location.href = loginPath;
                return;
            }
            
            // Convert to array if single role
            if (!Array.isArray(allowedRoles)) {
                allowedRoles = [allowedRoles];
            }
            
            console.log("Allowed roles:", allowedRoles);
            
            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(userRole)) {
                console.log("User role not allowed, redirecting to appropriate dashboard");
                // Redirect to appropriate dashboard
                this.redirectToDashboard();
            } else {
                console.log("User has permission to access this page");
            }
        }
    };
    
    // Make RBACService available globally
    window.RBACService = RBACService;
} else {
    console.log("RBAC service already initialized");
}

// Execute on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide/show elements based on user role
    const roleElements = document.querySelectorAll('[data-role-access]');
    
    roleElements.forEach(element => {
        const requiredRoles = element.getAttribute('data-role-access').split(',');
        const userRole = RBACService.getUserRole();
        
        if (!userRole || !requiredRoles.includes(userRole)) {
            element.style.display = 'none';
        }
    });
});
