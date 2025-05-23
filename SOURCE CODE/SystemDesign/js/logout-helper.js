function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear JWT token and any user data
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Attempt to call server-side logout
        fetch('http://localhost/SOURCE_CODE/Employee/public/api/auth.php?action=logout', {
            method: 'GET'
        }).catch(error => {
            console.error('Logout API error:', error);
            // Continue with logout regardless of API result
        }).finally(() => {
            // Get current path to determine the correct relative path
            const pathname = window.location.pathname.toLowerCase();
            let loginPath;
            
            if (pathname.includes('/pages/')) {
                // We're in the pages directory
                loginPath = 'loginInterface.html';
            } else if (pathname.includes('/logininterface.html')) {
                // Already on the login page
                return;
            } else {
                // We're in the root directory
                loginPath = 'pages/loginInterface.html';
            }
            
            console.log("Redirecting to login page:", loginPath);
            window.location.href = loginPath;
        });
    }
}
