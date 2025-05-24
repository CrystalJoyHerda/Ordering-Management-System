// Inventory management script with enhanced product CRUD functionality

// Global variables
let products = [];
let currentPage = 1;
const productsPerPage = 6;
let filteredProducts = [];
let currentModalMode = 'add'; // 'add' or 'edit'
let selectedImageFile = null;

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
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?id=${encodeURIComponent(productData.id)}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },
    
    async deleteProduct(id) {
        return this.fetch(`${API_CONFIG.baseUrl}/products.php?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
    }
};

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory page loaded');
    
    // Skip checking for API client since we're using integrated API functions
    
    // Check authentication and roles
    checkAuth();
    
    // Load products automatically
    loadProducts();

    // Set up event listeners
    document.getElementById('add-product').addEventListener('click', () => openModal('add'));
    document.querySelector('.logout-btn').addEventListener('click', handleLogout);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Search and filter functionality
    document.getElementById('product-search').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('status-filter').addEventListener('change', filterProducts);
    
    // Image upload preview
    setupImageUpload();
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
    localStorage.removeItem('auth_token');
    window.location.href = '../pages/loginInterface.html';
}

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
            }));

            console.log('Processed products:', products);
            
            // Initialize filteredProducts with all products
            filteredProducts = [...products];
            
            // Display products and update pagination
            const productsToShow = filteredProducts.slice(0, productsPerPage);
            displayProducts(productsToShow);
            updatePagination(Math.ceil(filteredProducts.length / productsPerPage));
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
function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value.toLowerCase();
    
    // Filter products based on search term and filters
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryFilter === 'all' || product.category.toLowerCase() === categoryFilter;
        const matchesStatus = statusFilter === 'all' || product.status.toLowerCase() === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Get products for current page
    const start = 0;
    const end = productsPerPage;
    const productsToShow = filteredProducts.slice(start, end);
    
    // Display products and update pagination
    displayProducts(productsToShow);
    updatePagination(Math.ceil(filteredProducts.length / productsPerPage));
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
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>
                <img src="${product.image}" alt="${product.name}" 
                     class="product-image" onerror="this.src='../assets/images/logo.png'">
            </td>
            <td>
                <strong>${product.name}</strong><br>
                <small>${product.description}</small>
            </td>
            <td>₱${parseFloat(product.price).toFixed(2)}</td>
            <td><span class="category-badge ${product.category}">${product.category}</span></td>
            <td><span class="status-badge ${product.status}">${product.status}</span></td>
            <td>
                <button onclick="editProduct(${product.id})" class="edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn" title="Delete">
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
    if (newPage < 1 || newPage > Math.ceil(filteredProducts.length / productsPerPage)) return;
    currentPage = newPage;
    filterProducts();
}

// Function to open the product modal in add or edit mode
function openModal(mode, productId = null) {
    currentModalMode = mode;
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    // Reset form and image upload
    form.reset();
    resetImageUpload();
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add New Product';
        document.getElementById('product-id').value = '';
    } else if (mode === 'edit') {
        modalTitle.textContent = 'Edit Product';
        
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
            
            // If product has an image, show it in the upload container
            if (product.image) {
                const uploadContainer = document.getElementById('image-upload-container');
                uploadContainer.style.border = 'none';
                uploadContainer.innerHTML = `
                    <div class="image-preview" style="width:100%;height:100%;position:relative;">
                        <img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                        <div class="remove-image" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.5);color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                `;
                
                // Add event listener to remove button
                uploadContainer.querySelector('.remove-image').addEventListener('click', function(e) {
                    e.stopPropagation();
                    resetImageUpload();
                });
            }
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
    
    // Get form data
    const productId = document.getElementById('product-id').value;
    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productCategory = document.getElementById('product-category').value;
    const productStatus = document.getElementById('product-status').value;
    const productDescription = document.getElementById('product-description').value;
    
    // Validate required fields
    if (!productName || !productPrice || !productCategory) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Prepare product data object
    const productData = {
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        status: productStatus || 'active',
        description: productDescription || '',
        image: '../assets/images/logo.png' // Default image
    };
    
    try {
        let response;
        
        if (currentModalMode === 'add') {
            // Add new product
            response = await productApi.addProduct(productData);
            
            if (response.status === 'success') {
                // Add to local array with new ID
                productData.id = response.id;
                products.unshift(productData);
                showToast('Product added successfully!', 'success');
            } else {
                throw new Error(response.message || 'Failed to add product');
            }
        } else {
            // Update existing product
            productData.id = parseInt(productId);
            response = await productApi.updateProduct(productData);
            
            if (response.status === 'success') {
                // Update in local array
                const index = products.findIndex(p => p.id === productData.id);
                if (index !== -1) {
                    products[index] = {...products[index], ...productData};
                }
                showToast('Product updated successfully!', 'success');
            } else {
                throw new Error(response.message || 'Failed to update product');
            }
        }
        
        // Close modal and refresh product list
        closeModal();
        filteredProducts = [...products];
        
        // Reset to page 1
        currentPage = 1;
        const productsToShow = filteredProducts.slice(0, productsPerPage);
        displayProducts(productsToShow);
        updatePagination(Math.ceil(filteredProducts.length / productsPerPage));
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast(`Error: ${error.message}`, 'error');
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
                <div style="display: flex; margin-bottom: 20px;">
                    <div style="flex: 0 0 120px; margin-right: 20px;">
                        <img src="${product.image || '../assets/images/logo.png'}" 
                             alt="${product.name}" 
                             style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e0d5c5;">
                    </div>                    <div style="flex: 1;">
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

// Function to delete a product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await productApi.deleteProduct(productId);
            
            if (response.status === 'success') {
                // Remove product from local state
                products = products.filter(p => p.id !== productId);
                filteredProducts = filteredProducts.filter(p => p.id !== productId);
                
                // Refresh display
                const start = (currentPage - 1) * productsPerPage;
                const end = start + productsPerPage;
                const productsToShow = filteredProducts.slice(start, end);
                
                displayProducts(productsToShow);
                updatePagination(Math.ceil(filteredProducts.length / productsPerPage));
                
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

// Fallback logout function if the shared handler is not available
function handleLogoutFallback() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear JWT token and user data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Attempt to call server-side logout
        fetch(`${API_CONFIG.baseUrl}/auth.php?action=logout`, {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
            // Continue with logout regardless of API result
        }).finally(() => {
            // Redirect to login page using path detection
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
}

// Function to setup image upload preview
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
                        <div class="remove-image" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.5);color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                `;
                
                // Add event listener to remove button
                uploadContainer.querySelector('.remove-image').addEventListener('click', function(e) {
                    e.stopPropagation();
                    resetImageUpload();
                });
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Make sure clicking the container triggers file input
    uploadContainer.addEventListener('click', function() {
        if (!uploadContainer.querySelector('.image-preview')) {
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
            <p>Click to upload image</p>
        </div>
    `;
}

// Add event listener for clicking outside modal to close
window.addEventListener('click', (event) => {
    const modal = document.getElementById('product-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Add this line at the end of the file to expose the test function globally
window.testApiConnection = testApiConnection;

// Add this to make loadProducts accessible globally for the retry button
window.loadProducts = loadProducts;
