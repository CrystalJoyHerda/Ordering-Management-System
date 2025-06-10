// Inventory management script with enhanced product CRUD functionality

// Global variables
let products = [];
let currentPage = 1;
const productsPerPage = 6;
let filteredProducts = [];
let currentModalMode = 'add'; // 'add' or 'edit'

// API Configuration
const API_CONFIG_PARAMS = {
    FRONTEND_PORT: '5501',  // Live Server default port
    BACKEND_PORT: '80',    // Apache default port
    API_PATH: '/SOURCE_CODE/Employee/public/api'  // Updated path with underscore
};

// Live Server ports
const LIVE_SERVER_PORTS = ['5500', '5501'];

// Check if running under Live Server or other development server
const isLiveServer = LIVE_SERVER_PORTS.includes(window.location.port);
const isCustomFrontend = window.location.port === API_CONFIG_PARAMS.FRONTEND_PORT;
const isDevServer = isLiveServer || isCustomFrontend;

// Simplified API URL construction for Live Server vs Production
const API_FULL_URL = isLiveServer 
    ? `http://localhost${API_CONFIG_PARAMS.API_PATH}`  // Use localhost for Live Server
    : `http://127.0.0.1${API_CONFIG_PARAMS.API_PATH}`; // Use IP for production

// API configuration
const API_CONFIG = {
    baseUrl: API_FULL_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    getAuthToken: () => localStorage.getItem('auth_token')
};

// Log configuration on startup
console.log('Environment:', isLiveServer ? 'Live Server' : (isCustomFrontend ? 'Custom Frontend' : 'Production'));
console.log('API endpoint:', API_FULL_URL);

// Simple API client methods
const productApi = {    async fetch(url, options = {}) {
        try {
            // Set up proper CORS headers and credentials
            const fetchOptions = {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                mode: 'cors',
                credentials: 'include',
                cache: 'no-cache'
            };

            // Add auth token if available
            const token = API_CONFIG.getAuthToken();
            if (token) {
                fetchOptions.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error Response:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return {
                        status: response.ok ? 'success' : 'error',
                        data: text
                    };
                }
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // API methods
    async getProducts() {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php`);
    },
    
    async getProduct(id) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?id=${encodeURIComponent(id)}`);
    },
    
    async searchProducts(keyword, category) {
        const params = new URLSearchParams();
        if (keyword) params.append('search', keyword);
        if (category) params.append('category', category);
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?${params.toString()}`);
    },
    
    async addProduct(productData) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php`, {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },
      async updateProduct(productData) {
        console.log('Sending update request for product:', productData);
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?id=${encodeURIComponent(productData.id)}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },
      async deleteProduct(id) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
    },
    
    // Stock management methods
    async updateStock(productId, stockData) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?action=update_stock&id=${encodeURIComponent(productId)}`, {
            method: 'PUT',
            body: JSON.stringify(stockData)
        });
    },
    
    async getStockHistory(productId) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?action=stock_history&id=${encodeURIComponent(productId)}`);
    }
};

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory page loaded');
    
    // Skip checking for API client since we're using integrated API functions
    
    // Check authentication and roles
    checkAuth();
    
    // Load products automatically
    loadProducts();    // Set up event listeners
    document.getElementById('add-product').addEventListener('click', () => openModal('add'));
    document.querySelector('.logout-btn').addEventListener('click', handleLogout);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    document.getElementById('stock-form').addEventListener('submit', handleStockSubmit);
      // Search and filter functionality
    document.getElementById('product-search').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('status-filter').addEventListener('change', filterProducts);
    
    // Product name input - clear any autocomplete suggestions
    const productNameInput = document.getElementById('product-name');
    if (productNameInput) {
        productNameInput.addEventListener('input', function() {
            // Clear any browser autocomplete suggestions
            this.setAttribute('autocomplete', 'off');
            // Remove any potential suggestion dropdowns
            const suggestions = document.querySelectorAll('[id*="suggestion"], [class*="suggestion"], [class*="autocomplete"]');
            suggestions.forEach(el => el.remove());
        });
        
        productNameInput.addEventListener('focus', function() {
            // Ensure autocomplete is off when focused
            this.setAttribute('autocomplete', 'off');
        });
    }
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '../pages/loginInterface.html';
        return;
    }
    
    // If RBAC service is available, use it
    if (typeof RBACService !== 'undefined') {
        RBACService.enforcePageAccess('admin');
        
        const userData = RBACService.getUserData();
        if (userData) {
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = userData.name;
            }
        }
    } else {
        // Fallback to basic token parsing
        try {
            // Simple token format: SIMPLE.payload.TOKEN or REDIRECT.payload.TOKEN
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid token format');
            
            const payload = atob(parts[1]);
            const userData = JSON.parse(payload);
            
            if (userData.data && userData.data.role !== 'admin') {
                window.location.href = '../pages/loginInterface.html';
                return;
            }
            
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement && userData.data) {
                adminNameElement.textContent = userData.data.name;
            }
        } catch (e) {
            console.error('Error validating token', e);
            localStorage.removeItem('auth_token');
            window.location.href = '../pages/loginInterface.html';
        }
    }
}

// Function to handle logout
function handleLogout() {
    // Show the modal first - NEVER directly redirect
    const logoutModal = document.getElementById('logout-modal');
    if (logoutModal) {
        logoutModal.style.display = 'flex';
    } else {
        // Only use confirm as fallback if modal doesn't exist
        handleLogoutFallback();
    }
}

// Improved fallback function that uses confirmation dialog
function handleLogoutFallback() {
    if (confirm('Are you sure you want to logout?')) {
        performLogoutAction();
    }
    // If user clicks Cancel, do nothing - remain on the page
}

// Separated logout action function to avoid code duplication
function performLogoutAction() {
    // Clear JWT token and user data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user');
    
    // Attempt to call server-side logout
    fetch(`${API_CONFIG.baseUrl}/auth.php?action=logout`, {
        method: 'GET'
    }).catch(error => {
        console.error('Logout API error:', error);
    }).finally(() => {
        // Only redirect after explicit confirmation
        const pathname = window.location.pathname.toLowerCase();
        if (pathname.includes('/pages/')) {
            window.location.href = 'loginInterface.html';
        } else {
            window.location.href = 'pages/loginInterface.html';
        }
    });
}

// Logout Modal Functionality - make sure this runs only once
document.addEventListener('DOMContentLoaded', function() {
    const logoutModal = document.getElementById('logout-modal');
    const logoutBtn = document.querySelector('.logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    
    // Replace direct action with our modal-first approach
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', handleLogout); // Remove any existing listener
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Only show the modal - do nothing else
            if (logoutModal) {
                logoutModal.style.display = 'flex';
            }
        });
    }
    
    // Only logout when confirm button is clicked
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // First hide the modal
            logoutModal.style.display = 'none';
            
            // Only then perform the actual logout with redirect
            performLogoutAction();
        });
    }
    
    // Just close modal when cancel is clicked
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });
    }
    
    // Just close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
});

// Function to load products from API
async function loadProducts() {
    console.log('Loading products...');
    
    try {
        // Set up loading state
        document.getElementById('products-list').innerHTML = `
            <tr><td colspan="7" class="text-center">
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #67503b;"></i>
                    <p style="margin-top: 10px; color: #67503b;">Loading products...</p>
                </div>
            </td></tr>
        `;

        // Use the integrated API client to fetch products
        const data = await productApi.getProducts();
        console.log('Raw products data:', data);
        
        if (data.status === 'success' && Array.isArray(data.data)) {
            // Process the products data
            products = data.data.map(product => ({
                ...product,
                price: parseFloat(product.price),
                status: product.status || 'active',
                description: product.description || '',
                image: product.image || '../assets/images/logo.png'
            }));            console.log('Processed products:', products);
              // Initialize filteredProducts with all products
            filteredProducts = [...products];
            
            // Automatically check and update product statuses based on stock levels
            await updateProductStatuses();
            
            // Reset to first page and display products
            currentPage = 1;
            filterProducts(false);
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('API error:', error);
        
        // Show user-friendly error message with retry option
        document.getElementById('products-list').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div style="padding: 20px; text-align: center; color: #e53935;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                        <p style="margin-top: 10px;">Unable to load products. Please try again.</p>
                        <p style="margin-top: 5px; font-size: 14px; color: #777;">${error.message}</p>
                        <div style="margin-top: 15px;">
                            <button onclick="testApiConnection()" style="margin-right: 10px; padding: 5px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-vial"></i> Test Connection
                            </button>
                            <button onclick="loadProducts()" style="padding: 5px 15px; background-color: #67503b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Function to test API connection
function testApiConnection() {
    const testUrl = `${API_CONFIG.baseUrl}/products.php?test=1`;
    
    document.getElementById('products-list').innerHTML = `
        <tr><td colspan="7" class="text-center">
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #67503b;"></i>
                <p style="margin-top: 10px; color: #67503b;">Testing API connection...</p>
            </div>
        </td></tr>
    `;
    
    fetch(testUrl, { 
        mode: 'cors',
        headers: API_CONFIG.headers
    })
    .then(response => {
        if (response.ok) {
            return response.text()
                .then(text => {
                    document.getElementById('products-list').innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">
                                <div style="padding: 20px; text-align: center; color: #4CAF50;">
                                    <i class="fas fa-check-circle" style="font-size: 24px;"></i>
                                    <p style="margin-top: 10px;">Connection successful!</p>
                                    <p style="margin-top: 5px; font-size: 14px; color: #777;">Response: ${text}</p>
                                    <button onclick="loadProducts()" style="margin-top: 10px; padding: 5px 15px; background-color: #67503b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-redo"></i> Load Products
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    })
    .catch(error => {
        document.getElementById('products-list').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div style="padding: 20px; text-align: center; color: #e53935;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                        <p style="margin-top: 10px;">Connection test failed: ${error.message}</p>
                        <p style="margin-top: 5px; font-size: 14px; color: #777;">
                            Make sure the server is running and the API endpoint is accessible at:
                            <br>${testUrl}
                        </p>
                        <button onclick="loadProducts()" style="margin-top: 10px; padding: 5px 15px; background-color: #67503b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Function to filter products based on search and filter options
function filterProducts(resetPage = true) {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value.toLowerCase();
    
    // Debug: Log current filter and available categories
    if (categoryFilter && categoryFilter !== 'all') {
        console.log('Filtering by category:', categoryFilter);
        console.log('Available product categories:', [...new Set(products.map(p => p.category))]);
    }
      // Filter products based on search term and filters
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
          // Enhanced category matching - handle exact matches only
        let matchesCategory = false;
        if (categoryFilter === '' || categoryFilter === 'all') {
            matchesCategory = true;
        } else {
            // Exact match (case insensitive)
            const productCategory = (product.category || '').toLowerCase().trim();
            const filterCategory = categoryFilter.toLowerCase().trim();
            
            if (productCategory === filterCategory) {
                matchesCategory = true;
            } else {
                // Handle only specific legacy mappings for exact categories
                if (filterCategory === 'non coffee' && (productCategory === 'non-coffee' || productCategory === 'beverage')) {
                    matchesCategory = true;
                } else if (filterCategory === 'pastry' && productCategory === 'pastries') {
                    matchesCategory = true;
                } else if (filterCategory === 'sandwich' && productCategory === 'sandwiches') {
                    matchesCategory = true;
                } else if (filterCategory === 'cake' && productCategory === 'cakes') {
                    matchesCategory = true;
                }
            }
        }
        
        const matchesStatus = statusFilter === '' || statusFilter === 'all' || product.status.toLowerCase() === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Reset to first page only when filters change, not during pagination
    if (resetPage) {
        currentPage = 1;
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    // Ensure current page is within valid range
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    // Get products for current page with proper pagination calculation
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const productsToShow = filteredProducts.slice(start, end);
    
    // Display products and update pagination
    displayProducts(productsToShow);
    updatePagination(totalPages);
}

// Function to display products with pagination
function displayProducts(productsToShow) {
    const tableBody = document.getElementById('products-list');
    if (!tableBody) {
        console.error('Products list container not found');
        return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    if (!productsToShow || productsToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="no-products">
                        <i class="fas fa-coffee"></i>
                        <p>No products found</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    // Start index for current page
    const startIndex = (currentPage - 1) * productsPerPage;

    // Display each product
    productsToShow.forEach((product, index) => {
        const row = document.createElement('tr');
        
        // Determine stock status and color
        const stockQuantity = product.stock_quantity || 0;
        const lowStockThreshold = product.low_stock_threshold || 5;
        let stockClass = 'stock-normal';
        let stockIcon = 'fas fa-check-circle';
        
        if (stockQuantity === 0) {
            stockClass = 'stock-empty';
            stockIcon = 'fas fa-times-circle';
        } else if (stockQuantity <= lowStockThreshold) {
            stockClass = 'stock-low';
            stockIcon = 'fas fa-exclamation-triangle';
        }
        
        // Determine what the status should be based on stock levels
        const autoStatus = determineAutoStatus(stockQuantity, lowStockThreshold);
        const displayStatus = autoStatus; // Use the automatically determined status for display
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>
                <strong>${product.name}</strong><br>
                <small>${product.description}</small>
            </td>
            <td>₱${parseFloat(product.price).toFixed(2)}</td>
            <td><span class="category-badge ${product.category}">${product.category}</span></td>
            <td>
                <div class="stock-info ${stockClass}">
                    <i class="${stockIcon}"></i>
                    <span class="stock-number">${stockQuantity}</span>
                    <button onclick="openStockModal(${product.id})" class="btn-stock-update" title="Update Stock">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            <td><span class="status-badge ${displayStatus}">${displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</span></td>
            <td>
                <button onclick="editProduct(${product.id})" class="btn-action btn-edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id})" class="btn-action btn-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to update pagination
function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

// Function to handle page changes
function changePage(newPage) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    filterProducts(false); // Don't reset page when navigating
}

// Function to open the product modal in add or edit mode
function openModal(mode, productId = null) {
    currentModalMode = mode;
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    // Reset form
    form.reset();
    
    // Get stock field row elements (now separated)
    const stockQuantityRow = document.getElementById('stock-quantity-row');
    const lowStockThresholdRow = document.getElementById('low-stock-threshold-row');
    const stockQuantityInput = document.getElementById('product-stock-quantity');
    const lowStockThresholdInput = document.getElementById('product-low-stock-threshold');
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add New Product';
        document.getElementById('product-id').value = '';
        
        // Show both stock fields for add mode
        if (stockQuantityRow) {
            stockQuantityRow.style.display = 'flex';
        }
        if (lowStockThresholdRow) {
            lowStockThresholdRow.style.display = 'flex';
        }
        
        // Make stock fields required for add mode
        if (stockQuantityInput) stockQuantityInput.setAttribute('required', 'required');
        if (lowStockThresholdInput) lowStockThresholdInput.setAttribute('required', 'required');
        
        // Clear any autocomplete suggestions for add mode
        const productNameInput = document.getElementById('product-name');
        if (productNameInput) {
            productNameInput.setAttribute('autocomplete', 'off');
            productNameInput.value = '';
        }
    } else if (mode === 'edit') {
        modalTitle.textContent = 'Edit Product';
        
        // Hide stock quantity field but show low stock threshold field for edit mode
        if (stockQuantityRow) {
            stockQuantityRow.style.display = 'none';
        }
        if (lowStockThresholdRow) {
            lowStockThresholdRow.style.display = 'flex';
        }
        
        // Remove required attribute from stock quantity but keep it for low stock threshold
        if (stockQuantityInput) stockQuantityInput.removeAttribute('required');
        if (lowStockThresholdInput) lowStockThresholdInput.setAttribute('required', 'required');
        
        // Find the product by ID
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Fill form with product data
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-status').value = product.status || 'active';
            document.getElementById('product-description').value = product.description || '';
            
            // Populate stock fields (stock quantity hidden, low stock threshold visible)
            document.getElementById('product-stock-quantity').value = product.stock_quantity || 0;
            document.getElementById('product-low-stock-threshold').value = product.low_stock_threshold || 5;
        }
    }
    
    // Show modal
    modal.classList.add('show');
}

// Function to close the product modal
function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('show');
}

// Function to handle form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('product-id').value;
      
    // Set status based on form selection
    let autoStatus = document.getElementById('product-status').value;

    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        status: autoStatus, // Use the status from the dropdown
        description: document.getElementById('product-description').value
    };
      // Include stock data based on mode
    if (currentModalMode === 'add') {
        // Get stock values from form fields for add mode
        const stockQuantity = parseInt(document.getElementById('product-stock-quantity').value) || 20;
        const lowStockThreshold = parseInt(document.getElementById('product-low-stock-threshold').value) || 5;
        
        productData.stock_quantity = stockQuantity;
        productData.low_stock_threshold = lowStockThreshold;
    } else if (currentModalMode === 'edit') {
        // For edit mode, include only low stock threshold (stock quantity remains unchanged)
        const lowStockThreshold = parseInt(document.getElementById('product-low-stock-threshold').value) || 5;
        productData.low_stock_threshold = lowStockThreshold;
    }
    
    // Validate required fields
    if (!productData.name || !productData.price || !productData.category) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Add product ID for edit mode
    if (currentModalMode === 'edit' && productId) {
        productData.id = productId;
    }
    
    try {
        let result;
        
        if (currentModalMode === 'add') {
            showToast('Adding product...', 'info');
            result = await productApi.addProduct(productData);
        } else {
            showToast('Updating product...', 'info');
            result = await productApi.updateProduct(productData);
        }
        
        if (result.status === 'success') {
            showToast(`Product ${currentModalMode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
            closeModal();
            await loadProducts();
        } else {
            showToast(result.message || `Failed to ${currentModalMode} product`, 'error');
        }
    } catch (error) {
        console.error(`Error ${currentModalMode}ing product:`, error);
        showToast(`Error ${currentModalMode}ing product: ` + error.message, 'error');
    }
}

// Function to edit a product
function editProduct(productId) {
    openModal('edit', productId);
}

// Function to view product details
function viewProduct(productId) {
    // Find the product
    const product = products.find(p => p.id === productId);
    
    if (product) {
        // Create and show a product details modal
        const detailsHTML = `
            <div class="modal-header">
                <div>Product Details</div>
                <button class="close-modal" onclick="this.closest('.modal').classList.remove('show')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #3b2a1f;">${product.name}</h3>
                    <div style="margin-bottom: 5px;">
                        <span class="status-badge ${product.status ? 
                            (product.status === 'active' ? 'status-active' : 
                             product.status === 'inactive' ? 'status-inactive' : 'status-low') 
                            : 'status-active'}">
                            ${product.status ? 
                              (product.status.charAt(0).toUpperCase() + product.status.slice(1)) 
                              : 'Active'}
                        </span>
                    </div>
                    <div style="color: #67503b; font-size: 20px; font-weight: 600; margin-top: 10px;">
                        ${new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                        }).format(product.price)}
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #3b2a1f; border-bottom: 1px solid #e0d5c5; padding-bottom: 8px;">Product Information</h4>
                    
                    <div style="display: flex; margin-bottom: 10px;">
                        <div style="flex: 0 0 100px; font-weight: 500; color: #67503b;">Category:</div>
                        <div>${product.category}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 10px;">
                        <div style="flex: 0 0 100px; font-weight: 500; color: #67503b;">Product ID:</div>
                        <div>${product.id}</div>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <div style="font-weight: 500; color: #67503b; margin-bottom: 5px;">Description:</div>
                        <div style="padding: 10px; background-color: #f9f5f1; border-radius: 6px; color: #555;">
                            ${product.description || 'No description available.'}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions" style="margin-top: 20px;">
                    <button class="btn-cancel" onclick="this.closest('.modal').classList.remove('show')">Close</button>
                    <button class="btn-save" onclick="editProduct(${product.id})">Edit Product</button>
                </div>
            </div>
        `;
        
        // Create temporary modal
        const tempModal = document.createElement('div');
        tempModal.className = 'modal';
        tempModal.innerHTML = `
            <div class="modal-content">
                ${detailsHTML}
            </div>
        `;
        
        // Add to document and show
        document.body.appendChild(tempModal);
        setTimeout(() => {
            tempModal.classList.add('show');
        }, 10);
    }
}

// Function to delete a product - replace existing function
function deleteProduct(productId) {
    showDeleteConfirmation(productId);
}

// New function to show delete confirmation
function showDeleteConfirmation(productId) {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'logout-modal';
    modalOverlay.id = 'delete-product-modal-' + productId;
    modalOverlay.style.display = 'flex';
    
    modalOverlay.innerHTML = `
        <div class="logout-modal-content">
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div class="logout-modal-buttons">
                <button onclick="confirmDelete(${productId})" class="confirm-logout">Yes, Delete</button>
                <button onclick="cancelDelete(${productId})" class="cancel-logout">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Close when clicking outside modal
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            cancelDelete(productId);
        }
    });
}

// Function to confirm deletion
function confirmDelete(productId) {
    // Remove modal
    const modal = document.getElementById('delete-product-modal-' + productId);
    if (modal) {
        modal.remove();
    }
    
    // Call the existing delete logic
    performDeleteProduct(productId);
}

// Function to cancel deletion
function cancelDelete(productId) {
    // Just remove the modal
    const modal = document.getElementById('delete-product-modal-' + productId);
    if (modal) {
        modal.remove();
    }
}

// Function to perform the actual deletion - extracted from deleteProduct
async function performDeleteProduct(productId) {
    try {
        const response = await productApi.deleteProduct(productId);
        
        if (response.status === 'success') {
            // Remove product from local state
            products = products.filter(p => p.id !== productId);
            filteredProducts = filteredProducts.filter(p => p.id !== productId);
            
            // Refresh display using current page (don't reset filters)
            filterProducts(false);
            
            // Show success message
            showToast('Product deleted successfully!', 'success');
        } else {
            throw new Error(response.message || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Function to show toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set toast icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle toast-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle toast-icon"></i>';
    }
    
    // Set toast content
    toast.innerHTML = `
        ${icon}
        <div class="toast-message">${message}</div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Set timeout to remove toast
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Improved logout fallback function that uses modal first
function handleLogoutFallback() {
    // Show modal first instead of immediate confirm dialog
    const logoutModal = document.getElementById('logout-modal');
    if (logoutModal) {
        logoutModal.style.display = 'flex';
    } else {
        // Only use confirm as fallback if modal doesn't exist
        if (confirm('Are you sure you want to logout?')) {
            performLogoutAction();
        }
    }
}

// Separated logout action function to avoid code duplication
function performLogoutAction() {
    // Clear JWT token and user data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user');
    
    // Attempt to call server-side logout
    fetch(`${API_CONFIG.baseUrl}/auth.php?action=logout`, {
        method: 'GET'
    }).catch(error => {
        console.error('Logout API error:', error);
    }).finally(() => {
        // Redirect to login page using path detection
        const pathname = window.location.pathname.toLowerCase();
        if (pathname.includes('/pages/')) {
            window.location.href = 'loginInterface.html';
        } else {
            window.location.href = 'pages/loginInterface.html';
        }
    });
}

// Logout Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutModal = document.getElementById('logout-modal');
    const logoutBtn = document.querySelector('.logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    
    // Show modal when logout button is clicked
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Just show the modal - no logout or redirect yet
            logoutModal.style.display = 'flex';
        });
    }
    
    // Only logout when confirm button is clicked
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // First hide the modal
            logoutModal.style.display = 'none';
            
            // Then perform actual logout action
            performLogoutAction();
        });
    }
    
    // Just close modal when cancel is clicked - no logout or redirect
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });
    }
    
    // Just close modal when clicking outside - no logout or redirect
    window.onclick = function(event) {
        if (event.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    };
});

// Function to setup image upload preview
// Function to add image preview events (hover and click)
function addImagePreviewEvents(uploadContainer) {
    const imagePreview = uploadContainer.querySelector('.image-preview');
    const overlay = uploadContainer.querySelector('.image-overlay');
    
    if (imagePreview && overlay) {
        imagePreview.addEventListener('mouseenter', function() {
            overlay.style.display = 'flex';
        });
        
        imagePreview.addEventListener('mouseleave', function() {
            overlay.style.display = 'none';
        });
        
        // Make the entire preview clickable to change image
        imagePreview.addEventListener('click', function() {
            document.getElementById('product-image').click();
        });
    }
}

function setupImageUpload() {
    const imageInput = document.getElementById('product-image');
    const uploadContainer = document.getElementById('image-upload-container');
    
    // Check if elements exist
    if (!imageInput || !uploadContainer) {
        console.warn('Image upload elements not found');
        return;
    }
    
    // Handle file selection
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(event) {
                // Remove previous preview if exists
                const oldPreview = uploadContainer.querySelector('.image-preview');
                if (oldPreview) {
                    oldPreview.remove();
                }
                  // Create new preview
                uploadContainer.style.border = 'none';
                uploadContainer.innerHTML = `
                    <div class="image-preview" style="width:100%;height:100%;position:relative;">
                        <img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                        <div class="image-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);display:none;align-items:center;justify-content:center;border-radius:8px;">
                            <div style="color:white;text-align:center;">
                                <i class="fas fa-edit" style="font-size:24px;margin-bottom:5px;"></i>
                                <div>Click to change image</div>
                            </div>
                        </div>
                        <div class="remove-image" style="position:absolute;top:5px;right:5px;background:rgba(255,0,0,0.7);color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Remove image">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>                `;
                
                // Add event listener to remove button
                uploadContainer.querySelector('.remove-image').addEventListener('click', function(e) {
                    e.stopPropagation();
                    resetImageUpload();
                });
                
                // Add hover effect and click functionality using helper function
                addImagePreviewEvents(uploadContainer);
            };
            reader.readAsDataURL(file);
        }
    });
      // Make sure clicking the container triggers file input
    uploadContainer.addEventListener('click', function(e) {
        // Only trigger file input if we're not clicking on the remove button
        if (!e.target.closest('.remove-image')) {
            imageInput.click();
        }
    });
}

// Function to reset image upload
function resetImageUpload() {
    const imageInput = document.getElementById('product-image');
    const uploadContainer = document.getElementById('image-upload-container');
    
    if (!imageInput || !uploadContainer) return;
    
    // Clear file input
    imageInput.value = '';
    selectedImageFile = null;
    
    // Reset container appearance
    uploadContainer.style.border = '2px dashed #ccc';
    uploadContainer.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <div class="upload-text">Click to upload product image</div>
    `;
}

// Add event listener for clicking outside modal to close
window.addEventListener('click', (event) => {
    const productModal = document.getElementById('product-modal');
    const stockModal = document.getElementById('stock-modal');
    
    if (event.target === productModal) {
        closeModal();
    }
    
    if (event.target === stockModal) {
        closeStockModal();
    }
});

// Stock Management Functions
function openStockModal(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    // Populate stock modal with current product data
    document.getElementById('stock-product-id').value = product.id;
    document.getElementById('stock-product-name').value = product.name;
    document.getElementById('current-stock-display').value = product.stock_quantity || 0;
    document.getElementById('new-stock-quantity').value = product.stock_quantity || 0;
    document.getElementById('stock-reason').value = '';
    document.getElementById('stock-notes').value = '';
    
    // Show modal
    const modal = document.getElementById('stock-modal');
    modal.classList.add('show');
}

function closeStockModal() {
    const modal = document.getElementById('stock-modal');
    modal.classList.remove('show');
    
    // Reset form
    document.getElementById('stock-form').reset();
}

async function handleStockSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('stock-product-id').value;
    const newQuantity = parseInt(document.getElementById('new-stock-quantity').value);
    const reason = document.getElementById('stock-reason').value;
    const notes = document.getElementById('stock-notes').value;
    
    if (!productId || isNaN(newQuantity) || newQuantity < 0) {
        showToast('Please enter a valid stock quantity', 'error');
        return;
    }
    
    if (!reason) {
        showToast('Please select a reason for the stock change', 'error');
        return;
    }
      try {
        // Find the current product to get its details
        const currentProduct = products.find(p => p.id == productId);
        if (!currentProduct) {
            showToast('Product not found', 'error');
            return;
        }
        
        // Automatically determine the new status based on stock quantity
        let newStatus = currentProduct.status;
          // If stock is 0, set status to inactive
        if (newQuantity === 0) {
            newStatus = 'inactive';
        } 
        // If stock is <= 5, set status to low
        else if (newQuantity <= 5) {
            newStatus = 'low';
        }
        // If stock is > 5 and status was previously inactive or low because of stock
        else if (newQuantity > 5 && (currentProduct.status === 'inactive' || currentProduct.status === 'low')) {
            newStatus = 'active'; // Reset to active when stock is replenished
        }
        
        // Include status update in stock data
        const stockData = {
            stock_quantity: newQuantity,
            reason: reason,
            notes: notes,
            updated_by: 1, // You might want to get this from the current user session
            status: newStatus // Add status update
        };
        
        showToast('Updating stock...', 'info');
        
        // First update the stock
        const result = await productApi.updateStock(productId, stockData);
        
        if (result.status === 'success') {
            // If status changed, also update the product status in the database
            if (newStatus !== currentProduct.status) {
                // Update product with new status
                const productUpdateResult = await productApi.updateProduct({
                    id: productId,
                    status: newStatus
                });
                
                if (productUpdateResult.status === 'success') {
                    showToast(`Stock updated and status changed to ${newStatus}!`, 'success');
                } else {
                    showToast('Stock updated but status update failed!', 'warning');
                }
            } else {
                showToast('Stock updated successfully!', 'success');
            }
            
            closeStockModal();
            
            // Reload products to reflect the changes
            await loadProducts();
        } else {
            showToast(result.message || 'Failed to update stock', 'error');
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        showToast('Error updating stock: ' + error.message, 'error');
    }
}

// Function to determine automatic status based on stock levels
function determineAutoStatus(stockQuantity, lowStockThreshold) {
    stockQuantity = parseInt(stockQuantity) || 0;
    lowStockThreshold = parseInt(lowStockThreshold) || 5;
    
    if (stockQuantity === 0) {
        return 'inactive';
    } else if (stockQuantity <= lowStockThreshold) {
        return 'low';
    } else {
        return 'active';
    }
}

// Function to check and update product statuses automatically
async function updateProductStatuses() {
    console.log('Checking and updating product statuses...');
    
    let statusUpdatesNeeded = [];
    
    // Check each product for status updates needed
    products.forEach(product => {
        const currentStatus = product.status;
        const autoStatus = determineAutoStatus(product.stock_quantity, product.low_stock_threshold);
        
        // Only update if status needs to change
        if (currentStatus !== autoStatus) {
            statusUpdatesNeeded.push({
                id: product.id,
                name: product.name,
                currentStatus: currentStatus,
                newStatus: autoStatus,
                stockQuantity: product.stock_quantity,
                lowStockThreshold: product.low_stock_threshold
            });
        }
    });
    
    if (statusUpdatesNeeded.length === 0) {
        console.log('No status updates needed - all products have correct status');
        return;
    }
    
    console.log(`Found ${statusUpdatesNeeded.length} products that need status updates:`, statusUpdatesNeeded);
    
    // Update statuses in batches
    let successCount = 0;
    let errorCount = 0;
    
    for (const update of statusUpdatesNeeded) {
        try {
            const result = await productApi.updateProduct({
                id: update.id,
                status: update.newStatus
            });
            
            if (result.status === 'success') {
                // Update local product data
                const productIndex = products.findIndex(p => p.id === update.id);
                if (productIndex !== -1) {
                    products[productIndex].status = update.newStatus;
                }
                successCount++;
                console.log(`✅ Updated ${update.name}: ${update.currentStatus} → ${update.newStatus}`);
            } else {
                errorCount++;
                console.error(`❌ Failed to update ${update.name}:`, result.message);
            }
        } catch (error) {
            errorCount++;
            console.error(`❌ Error updating ${update.name}:`, error);
        }
    }
    
    // Show summary notification
    if (successCount > 0) {
        const message = errorCount > 0 
            ? `Status updated for ${successCount} products (${errorCount} failed)`
            : `Status automatically updated for ${successCount} products`;
        
        showToast(message, errorCount > 0 ? 'warning' : 'success');
    }
    
    // Update filtered products and refresh display
    filteredProducts = [...products];
    filterProducts(false);
}

// Add this line at the end of the file to expose the test function globally
window.testApiConnection = testApiConnection;

// Add this to make loadProducts accessible globally for the retry button
window.loadProducts = loadProducts;

// Make stock functions globally accessible
window.openStockModal = openStockModal;
window.closeStockModal = closeStockModal;

// Expose functions to global scope
window.deleteProduct = deleteProduct;
window.showDeleteConfirmation = showDeleteConfirmation;
window.confirmDelete = confirmDelete;
window.cancelDelete = cancelDelete;
