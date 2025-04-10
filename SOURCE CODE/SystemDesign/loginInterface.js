// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in - redirect immediately if so
    const userData = sessionStorage.getItem("user");
    if (userData) {
        const user = JSON.parse(userData);
        redirectToDashboard(user);
        return;
    }

    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");
    
    console.log("Login form initialized");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("Form submitted");

        // Show loading indicator
        const submitButton = loginForm.querySelector("button[type='submit']");
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Logging in...";
        submitButton.disabled = true;

        // CHANGE HERE: Updated to use 'name' instead of 'username' to match our PHP backend
        const formData = {
            name: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value.trim()
        };

        console.log("Sending data:", formData);

        try {
            // CHANGE HERE: Removed the unnecessary '?action=login' parameter
            const response = await fetch("http://localhost/Employee/public/api/auth.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });

            console.log("Response status:", response.status);
            
            const data = await response.json();
            console.log("Response data:", data);

            if (data.status === "success") {
                // Store user data in session storage
                sessionStorage.setItem("user", JSON.stringify(data.data));
                
                // Redirect to appropriate dashboard
                redirectToDashboard(data.data);
            } else {
                errorMessage.textContent = data.message || "Login failed";
                errorMessage.style.display = "block";
            }
        } catch (error) {
            console.error("Login error:", error);
            errorMessage.textContent = "Connection error. Please try again.";
            errorMessage.style.display = "block";
        } finally {
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
});

// Function to handle dashboard redirection
function redirectToDashboard(user) {
    console.log("Redirecting user with role:", user.role);
    
    if (user.role === "admin") {
        window.location.href = "adminDashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}