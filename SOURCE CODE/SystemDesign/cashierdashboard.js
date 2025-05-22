// Logout button functionality
function handleLogout() {
    if(confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// Make sidebar links highlight on click
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        this.parentElement.classList.add('active');
    });
});

// Function to update dashboard data
function updateDashboard() {
    // Update datetime
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    document.querySelector('#datetime').textContent = now.toLocaleDateString('en-US', options);
}

// Update dashboard every minute
updateDashboard();
setInterval(updateDashboard, 60000);
