/**
 * Authentication Helper for Ordering Management System
 */

// Store auth token in localStorage
const AuthService = {
    /**
     * Save token
     * @param {string} token - Token from server
     */
    setToken: function(token) {
        localStorage.setItem('auth_token', token);
    },
    
    /**
     * Get saved token
     * @returns {string|null} Token or null if not logged in
     */
    getToken: function() {
        return localStorage.getItem('auth_token');
    },
    
    /**
     * Remove token (logout)
     */
    removeToken: function() {
        localStorage.removeItem('auth_token');
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn: function() {
        return !!this.getToken();
    },
    
    /**
     * Get user info from token (without validation)
     * @returns {object|null} User data or null if not logged in
     */
    getUserInfo: function() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            // Simple token format: SIMPLE.payload.TOKEN
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            // Decode the base64 payload
            const payload = atob(parts[1]);
            
            // Parse the JSON
            const tokenData = JSON.parse(payload);
            return tokenData.data;
        } catch (e) {
            console.error('Error parsing token', e);
            return null;
        }
    },
    
    /**
     * Check if user has a specific role
     * @param {string|string[]} roles - Role(s) to check
     * @returns {boolean} True if user has role
     */
    hasRole: function(roles) {
        const user = this.getUserInfo();
        if (!user) return false;
        
        if (!Array.isArray(roles)) {
            roles = [roles];
        }
        
        return roles.includes(user.role);
    },
    
    /**
     * Add authorization header to fetch options
     * @param {object} options - Fetch options object
     * @returns {object} Updated options with auth header
     */
    addAuthHeader: function(options = {}) {
        const token = this.getToken();
        if (!token) return options;
        
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
        
        return options;
    },
    
    /**
     * Fetch with authentication
     * @param {string} url - URL to fetch
     * @param {object} options - Fetch options
     * @returns {Promise} Fetch promise
     */
    authFetch: function(url, options = {}) {
        return fetch(url, this.addAuthHeader(options));
    },
    
    /**
     * Validate token and ensure it hasn't expired
     * @returns {boolean} True if token is valid and not expired
     */
    isTokenValid: function() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            // Simple token format: SIMPLE.payload.TOKEN
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            // Decode the base64 payload
            const payload = atob(parts[1]);
            
            // Parse the JSON
            const tokenData = JSON.parse(payload);
            
            // Check if token has expiration time
            if (tokenData.exp) {
                // Token expiration is in seconds, current time is in milliseconds
                const now = Math.floor(Date.now() / 1000);
                if (now >= tokenData.exp) {
                    return false; // Token has expired
                }
            }
            
            return true;
        } catch (e) {
            console.error('Error validating token', e);
            return false;
        }
    },
};

// Hide/show elements based on user role
document.addEventListener('DOMContentLoaded', function() {
    // Elements with data-role-access="admin,manager" will only be visible to those roles
    const roleElements = document.querySelectorAll('[data-role-access]');
    
    roleElements.forEach(element => {
        const requiredRoles = element.getAttribute('data-role-access').split(',');
        if (!AuthService.hasRole(requiredRoles)) {
            element.style.display = 'none';
        }
    });
});
