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

        // If all required fields are filled
        alert('Employee data saved!');
        popupContainer.style.display = 'none';
        document.getElementById('employeeForm').reset();
    });
});