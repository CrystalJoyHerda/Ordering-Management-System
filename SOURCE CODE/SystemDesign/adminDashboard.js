// Add error handling helper at the top of the file
async function handleApiResponse(response) {
    if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard loaded');
    
    // Check if user is logged in and is admin
    const userData = sessionStorage.getItem('user');
    if (!userData) {
        // Not logged in, redirect to login
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
        // Not an admin, redirect to regular dashboard
        window.location.href = 'dashboard.html';
        return;
    }
    
    // User is admin, continue loading admin dashboard
    document.getElementById('admin-name').textContent = user.name;
    
    // Load products automatically
    loadProducts();

    // Add event listeners
    document.getElementById('add-product').addEventListener('click', () => openModal());
    document.getElementById('logout').addEventListener('click', handleLogout);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
});

// Function to load products
async function loadProducts() {
    console.log('Loading products...');
    
    try {
        const apiUrl = 'http://localhost/Employee/public/api/products.php';
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        // Get the response as text first for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response from server');
        }
        
        console.log('Parsed data:', data);
        
        if (data.status === 'success' && data.data) {
            displayProducts(data.data);
        } else {
            throw new Error(data.message || 'Invalid data format');
        }
    } catch (error) {
        console.error('Fetch error details:', error);
        const tbody = document.getElementById('products-list');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="error-message">
                            Error loading products: ${error.message}
                            <br>
                            <button onclick="loadProducts()" class="retry-btn">Retry</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// Function to display products
function displayProducts(products) {
    console.log('Displaying products:', products);
    const tbody = document.getElementById('products-list');
    
    if (!tbody) {
        console.error('products-list element not found in the DOM');
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>₱${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.category || 'N/A'}</td>
            <td>
                <button onclick="editProduct(${product.id})" class="btn-edit">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="btn-delete">Delete</button>
            </td>
        </tr>
    `).join('');
    
    console.log('Products display complete');
}

// Edit product function 
async function editProduct(productId) {
    try {
        // Fetch product details
        const response = await fetch(`http://localhost/Employee/public/api/products.php?id=${productId}`);
        const result = await handleApiResponse(response);
        
        if (result.status === 'success') {
            const product = result.data;
            openModal(product);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product details');
    }
}

// Delete product function
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost/Employee/public/api/products.php?id=${productId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        // Get raw response for debugging
        const responseText = await response.text();
        console.log('Raw delete response:', responseText);
        
        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error('JSON parse error:', error);
            alert(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
            return;
        }

        if (result.status === 'success') {
            await loadProducts();
            alert('Product deleted successfully');
        } else {
            throw new Error(result.message || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete product: ' + error.message);
    }
}

function openModal(product = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const modalTitle = document.querySelector('.modal-content h3');
    
    // Clear previous form data
    form.reset();
    
    if (product) {
        // Editing existing product
        modalTitle.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
    } else {
        // Adding new product
        modalTitle.textContent = 'Add New Product';
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
}

// Handle product submit function
async function handleProductSubmit(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const formData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value
    };

    try {
        const url = productId 
            ? `http://localhost/Employee/public/api/products.php?id=${productId}&_method=PUT` 
            : 'http://localhost/Employee/public/api/products.php';
            
        const response = await fetch(url, {
            method: 'POST', // Always use POST
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await handleApiResponse(response);

        if (result.status === 'success') {
            closeModal();
            loadProducts(); // Refresh the products list
            alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
        } else {
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function handleLogout() {
    fetch('http://localhost/Employee/public/api/auth.php?action=logout', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        // Clear session storage
        sessionStorage.removeItem('user');
        // Redirect to login page with correct filename
        window.location.href = 'loginInterface.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still clear session and redirect even if API fails
        sessionStorage.removeItem('user');
        window.location.href = 'loginInterface.html';
    });
}

// Add event listener for clicking outside modal to close
window.addEventListener('click', (event) => {
    const modal = document.getElementById('product-modal');
    if (event.target === modal) {
        closeModal();
    }
});