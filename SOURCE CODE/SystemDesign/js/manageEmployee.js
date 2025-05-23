// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if RBAC service is available and enforce access
    if (typeof RBACService !== 'undefined') {
        // Enforce that only admin can access this page
        RBACService.enforcePageAccess('admin');
    } else {
        console.error("RBAC service not loaded! Redirecting to login...");
        // Fallback if RBAC service is not available
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDir ? '../loginInterface.html' : 'pages/loginInterface.html';
        window.location.href = loginPath;
        return;
    }
    
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
    // Use the shared logout helper if available
    if (typeof window.handleLogout === 'function') {
        window.handleLogout();
        return;
    }
    
    // Fallback logout function
    if(confirm('Are you sure you want to logout?')) {
        // Clear JWT token and user data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Attempt to call server-side logout
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
        }).finally(() => {
            // Redirect to login page
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
