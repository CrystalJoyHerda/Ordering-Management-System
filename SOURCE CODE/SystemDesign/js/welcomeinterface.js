document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    
    // Add hover effect
    menuButton.addEventListener('mouseenter', () => {
        menuButton.style.transform = 'scale(1.05)';
        menuButton.style.transition = 'transform 0.3s ease';
    });

    menuButton.addEventListener('mouseleave', () => {
        menuButton.style.transform = 'scale(1)';
    });

    // Add click handler
    menuButton.addEventListener('click', () => {
        // Add button click animation
        menuButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            menuButton.style.transform = 'scale(1)';
            // Redirect to menu page (update this URL as needed)
            window.location.href = './menuinterface.html';
        }, 200);
    });
});
