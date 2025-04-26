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

        const formData = new FormData(loginForm);
        const data = {
            name: formData.get("username"), // Map "username" to "name"
            password: formData.get("password"),
        };

        console.log("Sending data:", data);

        try {
            const response = await fetch("http://localhost/SOURCE_CODE/Employee/public/api/auth.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data), // Send the corrected data
                mode: 'cors', // Enable CORS
            });

            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Login successful:", result);

            if (result.status === "success") {
                // Store user data in session storage
                sessionStorage.setItem("user", JSON.stringify(result.data));
                
                // Redirect to appropriate dashboard
                redirectToDashboard(result.data);
            } else {
                errorMessage.textContent = result.message || "Login failed";
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