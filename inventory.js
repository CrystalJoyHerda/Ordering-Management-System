```javascript
// Improve the loadProducts function to handle fetch errors
async function loadProducts() {
  try {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = '<div class="loading">Loading products...</div>';
    
    const products = await apiClient.getProducts();
    
    if (products && products.length > 0) {
      displayProducts(products);
    } else {
      productContainer.innerHTML = '<div class="error">No products found</div>';
    }
  } catch (error) {
    console.error('API error:', error);
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = `<div class="error">Failed to load products. Please check your network connection and try again. (${error.message})</div>`;
    
    // Add retry button
    const retryBtn = document.createElement('button');
    retryBtn.innerText = 'Retry';
    retryBtn.classList.add('retry-btn');
    retryBtn.addEventListener('click', () => loadProducts());
    productContainer.appendChild(retryBtn);
  }
}
```