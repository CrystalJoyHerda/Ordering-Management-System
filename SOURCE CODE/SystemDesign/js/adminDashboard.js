/**
 * Admin Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');
    
    // Display admin name from auth data
    const userData = AuthService.getUserInfo();
    if (userData && userData.name) {
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = userData.name;
        }
    }
    
    // Initialize sidebar navigation
    initializeSidebar();
    
    function initializeSidebar() {
        // Highlight current page in sidebar
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.parentElement.classList.add('active');
            } else {
                link.parentElement.classList.remove('active');
            }
        });
    }
});