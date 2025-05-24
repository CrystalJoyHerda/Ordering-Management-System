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
            console.log('Parsing token structure...');
            
            // Check if it's a JWT token or our simple token format
            const parts = token.split('.');
            console.log(`Token has ${parts.length} parts`);
            
            if (parts.length === 3) {
                // It could be a JWT token or our SIMPLE token format
                if (token.startsWith('SIMPLE.') || token.startsWith('REDIRECT.')) {
                    // Simple token format: SIMPLE.payload.TOKEN or REDIRECT.payload.TOKEN
                    const payload = atob(parts[1]);
                    const tokenData = JSON.parse(payload);
                    return tokenData.data || tokenData;
                } else {
                    // Standard JWT token
                    // JWT tokens use base64url encoding, not standard base64
                    // We need to replace characters and add padding
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
                    
                    try {
                        // Now we can decode
                        const payload = atob(padded);
                        const tokenData = JSON.parse(payload);
                        console.log('Extracted user data from token:', tokenData);
                        
                        // Handle various token structures
                        if (tokenData.data) {
                            return tokenData.data;
                        } else if (tokenData.user) {
                            return tokenData.user;
                        } else {
                            return tokenData;
                        }
                    } catch (decodeError) {
                        console.log('JWT decode failed, trying fallback to stored user data');
                        // If JWT decode fails, try to use the stored user data
                        const userData = localStorage.getItem('user_data');
                        if (userData) {
                            return JSON.parse(userData);
                        }
                    }
                }
            }
            
            return null;
        } catch (e) {
            console.error('Error parsing token', e);
            // Try to use stored user data as fallback
            try {
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    return JSON.parse(userData);
                }
            } catch (storageError) {
                console.error('Error reading user data from storage', storageError);
            }
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
            // Check if it's a JWT token or our simple token format
            const parts = token.split('.');
            
            if (parts.length === 3) {
                let tokenData;
                
                if (token.startsWith('SIMPLE.') || token.startsWith('REDIRECT.')) {
                    // Simple token format
                    const payload = atob(parts[1]);
                    tokenData = JSON.parse(payload);
                } else {
                    // Standard JWT token - handle base64url encoding
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
                    
                    const payload = atob(padded);
                    tokenData = JSON.parse(payload);
                }
                
                // Check if token has expiration time
                if (tokenData.exp) {
                    // Token expiration is in seconds, current time is in milliseconds
                    const now = Math.floor(Date.now() / 1000);
                    if (now >= tokenData.exp) {
                        console.log('Token has expired');
                        return false; // Token has expired
                    }
                }
                
                return true;
            }
            
            return false;
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
