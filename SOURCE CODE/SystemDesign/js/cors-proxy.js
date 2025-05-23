/**
 * A JavaScript CORS proxy to handle API requests 
 * This allows us to make cross-origin requests without needing a server-side proxy
 */
class CorsProxy {    constructor() {
        // Base URL for all environments
        this.baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
            ? 'http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api'
            : '/SOURCE_CODE_SYSTEM/Employee/public/api';
    }

    /**
     * Determine the appropriate base URL based on the current environment
     * @returns {string} The base URL for API requests
     */    getBaseUrl() {
        // Use window.location to determine if we're on localhost/127.0.0.1
        const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        if (isLocalhost) {
            console.log('Using localhost API URL');
            return 'http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api';
        } else {
            console.log('Using production API URL');
            return '/SOURCE_CODE_SYSTEM/Employee/public/api';
        }
    }

    /**
     * Make an API request with automatic CORS handling
     * @param {string} endpoint - The API endpoint (e.g., 'products.php')
     * @param {Object} options - Fetch options (method, headers, body)
     * @returns {Promise<Object>} The API response as JSON
     */    async fetch(endpoint, options = {}) {
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}/${endpoint}`;
          // Default options with credentials included
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            mode: 'cors',
            credentials: 'include',
            cache: 'no-cache'
        };

        // Merge options
        const fetchOptions = { ...defaultOptions, ...options };
        
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetchOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`CorsProxy: Fetching from ${url}`);
        
        try {
            // First try direct fetch
            const response = await fetch(url, fetchOptions);
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get response text
            const responseText = await response.text();
            
            // Check if empty
            if (!responseText.trim()) {
                throw new Error("Empty response from server");
            }
            
            // Try to parse as JSON
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error("JSON parse error:", e);
                throw new Error("Invalid JSON response from server: " + e.message);
            }
        } catch (error) {
            // If direct fetch fails and we're on Live Server, try JSONP as fallback
            if ((window.location.port === '5500' || window.location.port === '5501') && 
                fetchOptions.method === 'GET') {
                console.log('Direct fetch failed, trying JSONP fallback');
                return this.fetchWithJSONP(`${url}?${new URLSearchParams(fetchOptions.body || {})}`);
            }
            
            // Otherwise, rethrow the error
            throw error;
        }
    }

    /**
     * Fallback method using JSONP for GET requests when CORS is an issue
     * @param {string} url - The full URL to fetch from
     * @returns {Promise<Object>} The API response
     */
    fetchWithJSONP(url) {
        return new Promise((resolve, reject) => {
            // Generate a unique callback name
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            
            // Create script element
            const script = document.createElement('script');
            
            // Define the callback function
            window[callbackName] = (data) => {
                // Clean up
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };
            
            // Set up the script
            const timestamp = new Date().getTime();
            script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}&_=${timestamp}`;
            script.onerror = () => {
                // Clean up
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Failed to load data with JSONP'));
            };
            
            // Append script to the body
            document.body.appendChild(script);
        });
    }
    
    /**
     * Get a list of products
     * @returns {Promise<Object>} The products data
     */
    async getProducts() {
        return this.fetch('products.php');
    }
    
    /**
     * Add a new product
     * @param {Object} product - The product data to add
     * @returns {Promise<Object>} The API response
     */
    async addProduct(product) {
        return this.fetch('products.php', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }
    
    /**
     * Update an existing product
     * @param {Object} product - The product data to update
     * @returns {Promise<Object>} The API response
     */
    async updateProduct(product) {
        return this.fetch('products.php', {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }
    
    /**
     * Delete a product
     * @param {number} productId - The ID of the product to delete
     * @returns {Promise<Object>} The API response
     */
    async deleteProduct(productId) {
        return this.fetch('products.php', {
            method: 'DELETE',
            body: JSON.stringify({ id: productId })
        });
    }
}

// Create a global instance for use throughout the application
window.apiProxy = new CorsProxy();
