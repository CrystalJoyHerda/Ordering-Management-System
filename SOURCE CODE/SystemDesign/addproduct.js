// JavaScript for Add Product Popup
document.addEventListener('DOMContentLoaded', () => {
  const addProductBtn = document.getElementById('addProductBtn'); // Button to open the popup
  const addProductPopup = document.getElementById('addProductPopup'); // Popup container
  const cancelBtn = document.getElementById('cancelBtn'); // Cancel/Close button
  const saveBtn = document.getElementById('saveBtn'); // Save button

  // Show the popup
  addProductBtn.addEventListener('click', () => {
    addProductPopup.style.display = 'flex';
  });

  // Close the popup
  cancelBtn.addEventListener('click', () => {
    addProductPopup.style.display = 'none';
  });

  // Save button logic
  saveBtn.addEventListener('click', () => {
    const prdId = document.getElementById('prdId').value;
    const productName = document.getElementById('productName').value;
    const category = document.getElementById('category').value;
    const stockQuantity = document.getElementById('stockQuantity').value;
    const price = document.getElementById('price').value;
    const status = document.getElementById('status').value;

    if (!prdId || !productName || !category || !stockQuantity || !price || !status) {
      alert('Please fill in all fields!');
      return;
    }

    // Show success popup
    showSuccessPopup();
    
    // Clear form and close popup
    addProductPopup.style.display = 'none';
    document.getElementById('productForm').reset();
  });
});

function showSuccessPopup() {
  const successPopup = document.createElement('div');
  successPopup.className = 'success-popup';
  successPopup.innerHTML = `
    <div class="success-content">
      <p>Added Successfully!</p>
      <button onclick="this.parentElement.parentElement.remove()">OK</button>
    </div>
  `;
  document.body.appendChild(successPopup);
}