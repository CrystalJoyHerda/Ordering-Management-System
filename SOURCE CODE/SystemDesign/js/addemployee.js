document.addEventListener('DOMContentLoaded', () => {
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const popupContainer = document.getElementById('popupContainer');
    const closeBtn = document.getElementById('closeBtn');

    // Show the popup
    addEmployeeBtn.addEventListener('click', () => {
        popupContainer.style.display = 'flex';
    });

    // Close the popup
    closeBtn.addEventListener('click', () => {
        popupContainer.style.display = 'none';
        document.getElementById('employeeForm').reset();
    });

    // Add input validation for contact number
    const contactInput = document.getElementById('contact');
    contactInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Save button
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', () => {
        const empId = document.getElementById('empId').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const birthday = document.getElementById('birthday').value;
        const contact = document.getElementById('contact').value.trim();
        const email = document.getElementById('email').value.trim();
        const role = document.getElementById('role').value.trim();

        if (!empId || !firstName || !lastName || !birthday || !contact || !email || !role) {
            alert('Please fill in all required fields!');
            return;
        }

        // Validate contact number (exactly 11 digits)
        if (!/^\d{11}$/.test(contact)) {
            alert('Contact number must be exactly 11 digits');
            return;
        }

        // Show success popup
        showSuccessPopup();
        
        // Clear form and close popup
        popupContainer.style.display = 'none';
        document.getElementById('employeeForm').reset();
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