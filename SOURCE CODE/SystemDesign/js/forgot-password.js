document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const newPasswordModal = document.getElementById('newPasswordModal');
    const resetForm = document.getElementById('resetForm');
    const newPasswordForm = document.getElementById('newPasswordForm');
    
    // Show forgot password modal
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'flex';
    });
    
    // Close modals
    document.querySelectorAll('.close, .cancel-btn').forEach(button => {
        button.addEventListener('click', () => {
            forgotPasswordModal.style.display = 'none';
            newPasswordModal.style.display = 'none';
            resetForm.reset();
            newPasswordForm.reset();
        });
    });
    
    // Handle email verification
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        const errorDiv = document.getElementById('resetError') || document.createElement('div');
        errorDiv.className = 'error-message';
        
        if (!document.getElementById('resetError')) {
            resetForm.appendChild(errorDiv);
        }
        
        try {
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/verify-email.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                forgotPasswordModal.style.display = 'none';
                document.getElementById('resetUserEmail').value = email;
                newPasswordModal.style.display = 'flex';
                errorDiv.textContent = '';
            } else {
                errorDiv.textContent = 'Invalid email address. Please try again.';
            }
        } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = 'Server error. Please try again.';
        }
    });
    
    // Handle password reset
    newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const userEmail = document.getElementById('resetUserEmail').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

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

            const data = await response.json();
            
            if (data.status === 'success') {
                alert('Password reset successful!');
                newPasswordModal.style.display = 'none';
            } else {
                alert('Failed to reset password');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Please try again.');
        }
    });
});
