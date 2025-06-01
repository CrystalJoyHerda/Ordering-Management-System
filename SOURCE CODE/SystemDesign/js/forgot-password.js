document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const newPasswordModal = document.getElementById('newPasswordModal');
    const resetForm = document.getElementById('resetForm');
    const newPasswordForm = document.getElementById('newPasswordForm');
    
    // Show forgot password modal
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.classList.add('show');
        // Clear any previous error messages
        clearErrorMessages();
    });
    
    // Close modals
    document.querySelectorAll('.close, .cancel-btn').forEach(button => {
        button.addEventListener('click', () => {
            forgotPasswordModal.classList.remove('show');
            newPasswordModal.classList.remove('show');
            resetForm.reset();
            newPasswordForm.reset();
            clearErrorMessages();
        });
    });
    
    // Close modal when clicking outside
    [forgotPasswordModal, newPasswordModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                resetForm.reset();
                newPasswordForm.reset();
                clearErrorMessages();
            }
        });
    });
    
    function clearErrorMessages() {
        const errorDivs = document.querySelectorAll('.error-message, .success-message');
        errorDivs.forEach(div => div.remove());
    }
    
    function showMessage(element, message, isSuccess = false) {
        clearErrorMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = isSuccess ? 'success-message' : 'error-message';
        messageDiv.textContent = message;
        element.appendChild(messageDiv);
    }
    
    // Handle email verification
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value.trim();
        const submitBtn = resetForm.querySelector('.submit-btn');
        
        if (!email) {
            showMessage(resetForm, 'Please enter your email address.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage(resetForm, 'Please enter a valid email address.');
            return;
        }
          // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        
        try {
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/verify-email.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get response text first to debug JSON issues
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Try to parse JSON
            let data;            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                console.error('Response text:', responseText);
                throw new Error('Invalid response format from server');
            }
              if (data.status === 'success') {
                showMessage(resetForm, `Email verified! Account found for: ${data.data.name}`, true);
                
                // Store user data for later use
                newPasswordForm.setAttribute('data-user-name', data.data.name);
                newPasswordForm.setAttribute('data-user-role', data.data.role);
                newPasswordForm.setAttribute('data-user-id', data.data.emp_id);
                
                // Wait a moment to show success message, then switch modals
                setTimeout(() => {
                    forgotPasswordModal.classList.remove('show');
                    document.getElementById('resetUserEmail').value = email;
                    newPasswordModal.classList.add('show');
                    clearErrorMessages();
                }, 1500);
                
            } else {
                showMessage(resetForm, data.message || 'No account found with this email address. Please check your email and try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(resetForm, 'Unable to connect to server. Please check your internet connection and try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    });
    
    // Handle password reset
    newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const userEmail = document.getElementById('resetUserEmail').value;
        const submitBtn = newPasswordForm.querySelector('.submit-btn');
          // Validate passwords
        if (!newPassword || !confirmPassword) {
            showMessage(newPasswordForm, 'Please fill in both password fields.');
            return;
        }
        
        if (newPassword.length < 4) {
            showMessage(newPasswordForm, 'Password must be at least 4 characters long.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage(newPasswordForm, 'Passwords do not match. Please try again.');
            return;
        }        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';
        
        try {
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/reset-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userEmail,
                    newPassword: newPassword
                })
            });

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get response text first to debug JSON issues
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Try to parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                console.error('Response text:', responseText);
                throw new Error('Invalid response format from server');
            }
              if (data.status === 'success') {
                showMessage(newPasswordForm, 'Password reset successful! You can now login with your new password.', true);
                
                // Wait a moment to show success message, then close modal and prepare for manual login
                setTimeout(() => {
                    newPasswordModal.classList.remove('show');
                    newPasswordForm.reset();
                    clearErrorMessages();
                    
                    // Prepare the login form for manual entry
                    prepareLoginForm();
                }, 2000);
                
            } else {
                showMessage(newPasswordForm, data.message || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(newPasswordForm, 'Unable to connect to server. Please check your internet connection and try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';        }
    });    
    // Function to prepare the login form for manual entry after password reset
    function prepareLoginForm() {
        const passwordField = document.getElementById('password');
        const usernameField = document.getElementById('username');
        
        // Clear the password field and focus on it
        if (passwordField) {
            passwordField.value = '';
            passwordField.focus();
        }
        
        // Pre-fill the username if we know it from the reset process
        const storedUserName = newPasswordForm.getAttribute('data-user-name');
        if (usernameField && storedUserName) {
            usernameField.value = storedUserName;
        }
        
        // Show success message on main login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = 'Password reset complete! Please login with your new password.';
            loginForm.appendChild(successDiv);
            
            // Auto-remove success message after 10 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 10000);
        }
    }
});
