class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api';
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('auth_token') ? 
                    `Bearer ${localStorage.getItem('auth_token')}` : '',
                'Origin': window.location.origin
            },
            credentials: 'include',
            mode: 'cors'
        };

        const fetchOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, fetchOptions);
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Handle empty response
            if (!responseText.trim()) {
                throw new Error("Empty response from server");
            }

            // Parse JSON response
            const data = JSON.parse(responseText);
            
            // Check for error status
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    // API endpoints
    async getProducts() {
        return this.fetch('products.php');
    }

    async addProduct(product) {
        return this.fetch('products.php', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }

    async updateProduct(product) {
        return this.fetch('products.php', {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }

    async deleteProduct(productId) {
        return this.fetch('products.php', {
            method: 'DELETE',
            body: JSON.stringify({ id: productId })
        });
    }
}

// Create global instance
window.apiClient = new ApiClient();
