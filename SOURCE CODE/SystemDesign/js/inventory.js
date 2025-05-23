// Inventory management script with enhanced product CRUD functionality

// Global variables
let products = [];
let currentPage = 1;
const productsPerPage = 6;
let filteredProducts = [];
let currentModalMode = 'add'; // 'add' or 'edit'
let selectedImageFile = null;

// Add error handling helper at the top of the file
async function handleApiResponse(response) {
    if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        
        try {
            // Get response as text first
            const responseText = await response.text();
            console.log("Error response:", responseText);
            
            // Try to parse as JSON if it appears to be JSON
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                try {
                    const error = JSON.parse(responseText);
                    throw new Error(error.message || `HTTP error! status: ${response.status}`);
                } catch (parseError) {
                    // If parsing fails, it's not valid JSON
                    throw new Error(`HTTP error! status: ${response.status} - ${responseText.substring(0, 100)}...`);
                }
            } else {
                // Not JSON, return the error with some of the response text
                throw new Error(`HTTP error! status: ${response.status} - ${responseText.substring(0, 100)}...`);
            }
        } catch (e) {
            throw new Error(`HTTP error! status: ${response.status} - ${e.message}`);
        }
    }
    
    try {
        // Get response as text first
        const responseText = await response.text();
        console.log("Raw success response:", responseText);
        
        // Check if it's empty or whitespace
        if (!responseText.trim()) {
            throw new Error("Empty response from server");
        }
        
        // Try to parse as JSON
        return JSON.parse(responseText);
    } catch (e) {
        console.error("JSON parse error:", e);
        throw new Error("Invalid JSON response from server: " + e.message);
    }
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory page loaded');
    
    // Check if RBAC service is available
    if (typeof RBACService !== 'undefined') {
        // Enforce admin-only access to this page
        RBACService.enforcePageAccess('admin');
        
        // Get user data and display name
        const userData = RBACService.getUserData();
        if (userData) {
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = userData.name;
            }
        }
    } else {
        // Fallback to basic authentication if RBAC is not available
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Not logged in, redirect to login
            window.location.href = '../loginInterface.html';
            return;
        }
        
        try {
            // Decode token to get user data
            const payload = token.split('.')[1];
            const userData = JSON.parse(atob(payload));
            const user = userData.data;
            
            if (user.role !== 'admin') {
                // Not an admin, redirect to appropriate dashboard
                if (user.role === 'cashier') {
                    window.location.href = 'cashierdashboard.html';
                } else {
                    window.location.href = '../loginInterface.html';
                }
                return;
            }
            
            // User is admin, continue loading inventory page
            // Display admin name if element exists
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = user.name;
            }
        } catch (e) {
            // Invalid token, redirect to login
            console.error('Token validation error:', e);
            localStorage.removeItem('auth_token');
            window.location.href = '../loginInterface.html';
            return;
        }
    }
    
    // Load products automatically
    loadProducts();

    // Add event listeners for CRUD operations
    document.getElementById('add-product').addEventListener('click', () => openModal('add'));
    document.querySelector('.logout-btn').addEventListener('click', function() {
        // Use shared logout helper if available, otherwise fall back to local implementation
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            handleLogoutFallback();
        }
    });
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Search and filter functionality
    document.getElementById('product-search').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('status-filter').addEventListener('change', filterProducts);
    
    // Image upload preview
    const imageInput = document.getElementById('product-image');
    const uploadContainer = document.getElementById('image-upload-container');
    
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
});

// Reset image upload to default state
function resetImageUpload() {
    const uploadContainer = document.getElementById('image-upload-container');
    const imageInput = document.getElementById('product-image');
    
    selectedImageFile = null;
    imageInput.value = '';
    
    uploadContainer.style.border = '2px dashed #d4c8b9';
    uploadContainer.innerHTML = `
        <input type="file" id="product-image" accept="image/*">
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <div class="upload-text">Click to upload product image</div>
    `;
    
    // Re-add event listener to new input
    document.getElementById('product-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            
            // Create preview (reuse the same code as above)
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadContainer.style.border = 'none';
                uploadContainer.innerHTML = `
                    <div class="image-preview" style="width:100%;height:100%;position:relative;">
                        <img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                        <div class="remove-image" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.5);color:white;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                `;
                
                uploadContainer.querySelector('.remove-image').addEventListener('click', function(e) {
                    e.stopPropagation();
                    resetImageUpload();
                });
            };
            reader.readAsDataURL(file);
        }
    });
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

        const data = await window.apiClient.getProducts();
        console.log('Raw products data:', data);
        
        if (data.status === 'success' && Array.isArray(data.data)) {
            // Store products in global variable
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
            
            // Get products for first page
            const start = 0;
            const end = productsPerPage;
            const productsToShow = filteredProducts.slice(start, end);
            
            console.log('Products to show:', productsToShow);
            
            // Display products and update pagination
            await displayProducts(productsToShow);
            updatePagination(Math.ceil(filteredProducts.length / productsPerPage));
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('API error:', error);
        
        // Show error message with retry option
        document.getElementById('products-list').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div style="padding: 20px; text-align: center; color: #e53935;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                        <p style="margin-top: 10px;">Unable to load products. Please try again.</p>
                        <p style="margin-top: 5px; font-size: 14px; color: #777;">${error.message}</p>
                        <button onclick="loadProducts()" style="margin-top: 10px; padding: 5px 15px; background-color: #67503b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}


// Function to filter products based on search and filter options
function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value.toLowerCase();
    
    // Filter products based on search term and filters
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || product.category.toLowerCase() === categoryFilter;
        const matchesStatus = statusFilter === 'all' || product.status.toLowerCase() === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    currentPage = Math.min(currentPage, totalPages) || 1;

    // Get products for current page
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const productsToShow = filteredProducts.slice(start, end);

    console.log('Filtered products to show:', productsToShow);

    // Display products and update pagination
    displayProducts(productsToShow);
    updatePagination(totalPages);
}

// Function to display products with pagination
async function displayProducts(productsToShow) {
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

// Add pagination update function
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

// Add page change handler
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
    
    // Prepare product data object
    const productData = {
        id: productId ? parseInt(productId) : undefined,
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        status: productStatus || 'active',
        description: productDescription,
        image: '../assets/images/logo.png' // Default image
    };
    
    try {
        const response = currentModalMode === 'add' 
            ? await window.apiClient.addProduct(productData)
            : await window.apiClient.updateProduct(productData);
            
        if (currentModalMode === 'add') {
            // Add new product to local state
            products.unshift({
                ...productData,
                id: response.data.id // Use ID from response
            });
            showToast('Product added successfully!', 'success');
        } else if (currentModalMode === 'edit') {
            // Update existing product in local state
            const productIndex = products.findIndex(p => p.id === productData.id);
            if (productIndex !== -1) {
                products[productIndex] = {
                    ...products[productIndex],
                    ...productData
                };
                showToast('Product updated successfully!', 'success');
            }
        }
        
        // Close modal and refresh product list
        closeModal();
        filteredProducts = [...products];
        displayProducts();
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
            await window.apiClient.deleteProduct(productId);
            
            // Remove product from local state
            products = products.filter(p => p.id !== productId);
            filteredProducts = filteredProducts.filter(p => p.id !== productId);
            
            // Refresh display
            displayProducts();
            
            // Show success message
            showToast('Product deleted successfully!', 'success');
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
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
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

// Add event listener for clicking outside modal to close
window.addEventListener('click', (event) => {
    const modal = document.getElementById('product-modal');
    if (event.target === modal) {
        closeModal();
    }
});
