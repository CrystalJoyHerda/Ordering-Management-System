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
        showAddEmployeeModal();
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

async function loadEmployees() {
    try {
        // Use simple XAMPP htdocs path to avoid CORS issues
        const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/employee.php');
        const result = await response.json();
        
        if (result.status === 'success') {
            displayEmployees(result.data);
        } else {
            console.error('Failed to load employees:', result.message);
            showNotification('Error loading employees: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        showNotification('Failed to connect to server. Make sure XAMPP is running and Employee API is set up.', 'error');
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (!employees || employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No employees found</td></tr>';
        return;
    }

    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.emp_id}</td>
            <td>${emp.name}</td>
            <td>${emp.email || 'N/A'}</td>
            <td>${emp.role}</td>
            <td>Active</td>
            <td>
                <button class="edit-btn" onclick="editEmployee(${emp.emp_id})">Edit</button>
                <button class="delete-btn" onclick="deleteEmployee(${emp.emp_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterEmployees(searchTerm) {
    const rows = document.querySelectorAll('#employeeTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[1]?.textContent.toLowerCase() || '';
        const email = row.cells[2]?.textContent.toLowerCase() || '';
        const role = row.cells[3]?.textContent.toLowerCase() || '';
        
        const matches = name.includes(searchTerm.toLowerCase()) || 
                       email.includes(searchTerm.toLowerCase()) ||
                       role.includes(searchTerm.toLowerCase());
        
        row.style.display = matches ? '' : 'none';
    });
}

async function editEmployee(empId) {
    try {
        // Get employee data via simple XAMPP path
        const response = await fetch(`http://localhost/SOURCE_CODE/Employee/public/api/employee.php?id=${empId}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            showEditEmployeeModal(result.data);
        } else {
            showNotification('Error loading employee data: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error fetching employee:', error);
        showNotification('Failed to load employee data', 'error');
    }
}

async function deleteEmployee(empId) {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost/SOURCE_CODE/Employee/public/api/employee.php?id=${empId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Employee deleted successfully', 'success');
            loadEmployees(); // Reload the table
        } else {
            showNotification('Error deleting employee: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        showNotification('Failed to delete employee', 'error');
    }
}

// Modal and notification functions
function showAddEmployeeModal() {
    const modal = createEmployeeModal('Add Employee', {});
    document.body.appendChild(modal);
}

function showEditEmployeeModal(employee) {
    const modal = createEmployeeModal('Edit Employee', employee);
    document.body.appendChild(modal);
}

function createEmployeeModal(title, employee = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <span class="close" onclick="closeModal(this)">&times;</span>
            </div>
            <form class="modal-form" onsubmit="handleEmployeeSubmit(event, ${employee.emp_id || 'null'})">                <div class="form-group">
                    <label for="employeeName">Name*</label>
                    <input type="text" id="employeeName" name="name" value="${employee.name || ''}" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="employeeEmail">Email</label>
                    <input type="email" id="employeeEmail" name="email" value="${employee.email || ''}" autocomplete="off">
                </div><div class="form-group">
                    <label for="employeeRole">Role*</label>
                    <select id="employeeRole" name="role" required autocomplete="off">
                        <option value="">Select Role</option>
                        <option value="admin" ${employee.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="cashier" ${employee.role === 'cashier' ? 'selected' : ''}>Cashier</option>
                    </select>
                </div>                ${!employee.emp_id ? `
                <div class="form-group">
                    <label for="employeePassword">Password*</label>
                    <input type="password" id="employeePassword" name="password" required autocomplete="new-password">
                </div>
                ` : `
                <div class="form-group">
                    <label for="employeePassword">New Password (leave blank to keep current)</label>
                    <input type="password" id="employeePassword" name="password" autocomplete="new-password">
                </div>
                `}
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeModal(this)">Cancel</button>
                    <button type="submit" class="submit-btn">${employee.emp_id ? 'Update' : 'Add'} Employee</button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

async function handleEmployeeSubmit(event, empId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Remove empty password field for updates
    if (empId && !data.password) {
        delete data.password;
    }
      try {
        let url = 'http://localhost/SOURCE_CODE/Employee/public/api/employee.php';
        let method = 'POST';
        
        if (empId) {
            url += `?id=${empId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            closeModal(form);
            loadEmployees(); // Reload the table
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        showNotification('Failed to save employee', 'error');
    }
}

function closeModal(element) {
    const modal = element.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <span class="notification-close" onclick="this.parentElement.remove()">&times;</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
