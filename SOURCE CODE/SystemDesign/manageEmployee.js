// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page
    loadEmployees();
    setupEventListeners();
});

function setupEventListeners() {
    // Logout button
    document.querySelector('.logout-btn').addEventListener('click', handleLogout);
    
    // Add employee button
    document.getElementById('addEmployeeBtn').addEventListener('click', () => {
        // Add employee logic
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterEmployees(e.target.value);
    });
}

function handleLogout() {
    if(confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

function loadEmployees() {
    // Sample data - replace with actual data fetching
    const employees = [
        // Add sample employee data here
    ];
    displayEmployees(employees);
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.userId}</td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.role}</td>
            <td>${emp.status}</td>
            <td>
                <button class="edit-btn" onclick="editEmployee(${emp.userId})">Edit</button>
                <button class="delete-btn" onclick="deleteEmployee(${emp.userId})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterEmployees(searchTerm) {
    // Implement search functionality
}

function editEmployee(userId) {
    // Implement edit functionality
}

function deleteEmployee(userId) {
    // Implement delete functionality
}
