// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Login page loaded");
    
    // Check if already logged in - redirect immediately if so
    const token = localStorage.getItem("auth_token");
    if (token) {
        try {
            // Decode token to get user data
            const payload = token.split('.')[1];
            const userData = JSON.parse(atob(payload));
            redirectToDashboard(userData.data);
            return;
        } catch (e) {
            // Invalid token, clear it
            console.error("Invalid token detected:", e);
            localStorage.removeItem("auth_token");
        }
    }

    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");
    const fallbackForm = document.getElementById("fallback-form");
    
    // Update fallback form fields when main form changes
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");
    const fallbackNameField = document.getElementById("fallback-name");
    const fallbackPasswordField = document.getElementById("fallback-password");
    
    usernameField.addEventListener("input", () => {
        fallbackNameField.value = usernameField.value;
    });
    
    passwordField.addEventListener("input", () => {
        fallbackPasswordField.value = passwordField.value;
    });
    
    console.log("Login form initialized");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("Form submitted");

        // Show loading indicator
        const submitButton = loginForm.querySelector("button[type='submit']");
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Logging in...";
        submitButton.disabled = true;
        
        const username = usernameField.value;
        const password = passwordField.value;
        
        if (!username || !password) {
            showError('Please enter both username and password');
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            return;
        }
        
        // Update fallback form values
        fallbackNameField.value = username;
        fallbackPasswordField.value = password;
        
        // Try to login with fetch first using form data to match what server expects
        try {
            const formData = new FormData();
            formData.append('name', username);
            formData.append('password', password);
            
            console.log("Attempting to login with form data");
            
            const response = await fetch('http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api/auth.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            console.log("Response status:", response.status);
            
            const result = await response.json();
            console.log("Login result:", result);
            
            if (result.status === "success") {
                // Store JWT token in localStorage
                localStorage.setItem("auth_token", result.token);
                
                // Redirect to appropriate dashboard
                redirectToDashboard(result.data);
                return;
            } else {
                showError(result.message || "Login failed");
            }
        } catch (error) {
            console.error("Form data login attempt failed:", error);
            
            // Try with JSON as fallback
            try {
                console.log("Attempting to login with JSON data");
                
                const jsonData = {
                    name: username,
                    password: password
                };
                
                const response = await fetch('http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(jsonData),
                    credentials: 'include'
                });
                
                console.log("JSON response status:", response.status);
                
                const result = await response.json();
                console.log("JSON login result:", result);
                
                if (result.status === "success") {
                    // Store JWT token in localStorage
                    localStorage.setItem("auth_token", result.token);
                    
                    // Redirect to appropriate dashboard
                    redirectToDashboard(result.data);
                    return;
                } else {
                    showError(result.message || "Login failed");
                }
            } catch (jsonError) {
                console.error("JSON login attempt failed:", jsonError);
                
                // Last resort: Try direct form submission
                console.log("Attempting direct form submission");
                fallbackForm.submit();
                return;
            }
        } finally {
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
    
    // Function to display error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 5000);
    }
    
    // Use the global RBACService
    function redirectToDashboard(user) {
        console.log("Redirecting user with role:", user.role);
        
        // Log the current location for debugging
        console.log("Current location:", window.location.href);
          
        // Use the RBAC service for redirection if available
        if (typeof window.RBACService !== 'undefined') {
            console.log("Using RBAC service for redirection");
            window.RBACService.redirectToDashboard();
            return;
        }
        
        // Fallback if RBAC service is not available
        console.log("RBAC service not available, using fallback redirection");
        let targetUrl;
        
        switch(user.role.toLowerCase()) {
            case "admin":
                console.log("Role is admin, redirecting to admin dashboard");
                targetUrl = "admindashboard.html";
                break;
            case "cashier":
                console.log("Role is cashier, redirecting to cashier dashboard");
                targetUrl = "cashierdashboard.html";
                break;
            case "manager":
                console.log("Role is manager, redirecting to manager dashboard");
                targetUrl = "managerdashboard.html";
                break;
            case "inventory":
                console.log("Role is inventory, redirecting to inventory dashboard");
                targetUrl = "inventoryInterface.html";
                break;
            default:
                // Fallback for any other role
                console.log("Unknown role, redirecting to default dashboard");
                targetUrl = "dashboard.html";
                break;
        }
        
        // Calculate the correct path based on current location
        let basePath = "";
        if (window.location.pathname.includes('/pages/')) {
            console.log("Currently in pages directory");
            basePath = ""; // Already in pages directory
        } else if (window.location.pathname.includes('/loginInterface.html')) {
            console.log("In root loginInterface.html");
            basePath = "pages/";
        } else {
            console.log("Not in pages directory");
            basePath = "pages/";
        }
        
        const fullPath = basePath + targetUrl;
        console.log("Redirecting to:", fullPath);
        window.location.href = fullPath;
    }
});