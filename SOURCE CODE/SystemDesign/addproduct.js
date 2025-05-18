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

    if (!currentFile) {
      alert('Please upload a product image');
      return;
    }

    // Show success popup
    showSuccessPopup();
    
    // Clear form and close popup
    addProductPopup.style.display = 'none';
    document.getElementById('productForm').reset();
  });

  // Enhanced image handling
  const dropZone = document.querySelector('.drop-zone');
  const imageInput = dropZone.querySelector('.drop-zone__input');
  const imagePreview = dropZone.querySelector('.image-preview');
  let currentFile = null;

  function handleImageDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drop-zone--over');

    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Please upload an image file (jpg, png, gif)');
      return;
    }

    currentFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
      dropZone.classList.add('has-image');
      imagePreview.innerHTML = `
        <img src="${e.target.result}" alt="Product Preview">
        <div class="image-actions">
          <button type="button" class="remove-image">×</button>
        </div>
      `;

      // Add remove button functionality
      imagePreview.querySelector('.remove-image').onclick = (e) => {
        e.stopPropagation();
        removeImage();
      };
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    currentFile = null;
    imageInput.value = '';
    dropZone.classList.remove('has-image');
    imagePreview.innerHTML = '';
  }

  // Event listeners for image handling
  dropZone.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageDrop);
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone--over');
  });

  ['dragleave', 'dragend'].forEach(type => {
    dropZone.addEventListener(type, () => {
      dropZone.classList.remove('drop-zone--over');
    });
  });

  dropZone.addEventListener('drop', handleImageDrop);
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