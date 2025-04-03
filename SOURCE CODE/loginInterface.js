// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Get references to form elements
    const usernameInput = document.querySelector("#username"); // Add an ID to your username input
    const passwordInput = document.querySelector("#password"); // Add an ID to your password input
    const loginButton = document.querySelector("#login-button"); // Add an ID to your login button
    const errorMessage = document.querySelector("#error-message"); // Add an ID for error messages

    // Add click event listener to the login button
    loginButton.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission

        // Get input values
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate inputs
        if (!username || !password) {
            showError("Username and password cannot be empty.");
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }

        // Simulate login (replace this with actual server-side authentication)
        if (username === "admin" && password === "password123") {
            alert("Login successful!");
            // Redirect to another page or perform other actions
            window.location.href = "dashboard.html"; // Example redirect
        } else {
            showError("Invalid username or password.");
        }
    });

    // Function to display error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block"; // Ensure the error message is visible
    }
});