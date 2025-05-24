/**
 * Logout Helper Script
 */

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                // Clear authentication data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                
                // Attempt to call server-side logout
                fetch('http://localhost:3000/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
                    method: 'GET'
                }).catch(error => {
                    console.error('Logout API error:', error);
                    // Continue with logout regardless of API result
                }).finally(() => {
                    // Redirect to login page
                    window.location.href = 'loginInterface.html';
                });
            }
        });
    }
});
