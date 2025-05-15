document.addEventListener('DOMContentLoaded', () => {
    // Update datetime
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        const dateTimeStr = now.toLocaleDateString('en-US', options);
        document.querySelector('.datetime').textContent = dateTimeStr;
    }
    
    // Initial datetime update and set interval
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Order type button selection
    const orderButtons = document.querySelectorAll('.order-button');
    orderButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            orderButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#e0e0e0';  // Reset to default
            });
            // Add active class and change background for clicked button
            button.classList.add('active');
            button.style.backgroundColor = '#ffffff';
        });
    });

    // Category button selection
    const categoryButtons = document.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update button states
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Switch grids based on category
            const coffeeGrid = document.querySelector('.coffee-grid');
            const snacksGrid = document.querySelector('.snacks-grid');
            
            if (button.textContent.trim() === 'Coffee') {
                coffeeGrid.classList.add('active');
                snacksGrid.classList.remove('active');
            } else {
                snacksGrid.classList.add('active');
                coffeeGrid.classList.remove('active');
            }
        });
    });

    // Food item selection
    const foodItems = document.querySelectorAll('.food-item');
    foodItems.forEach(item => {
        item.addEventListener('click', () => {
            const wasSelected = item.classList.contains('selected');
            item.classList.toggle('selected');
            
            // Hide quantity scaler when unselecting
            const scaler = item.querySelector('.quantity-scaler');
            if (!wasSelected) {
                scaler.classList.add('active');
            } else {
                scaler.classList.remove('active');
            }
            
            updateOrderSummary();
        });
    });

    // Food item and quantity scaler handling
    foodItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking quantity buttons or scaler
            if (e.target.closest('.quantity-scaler')) {
                e.stopPropagation(); // Prevent hiding when clicking inside scaler
                return;
            }
            
            const wasSelected = item.classList.contains('selected');
            if (!wasSelected) {
                // Only show scaler when selecting
                const scaler = item.querySelector('.quantity-scaler');
                scaler.classList.add('active');
                
                // Hide other scalers
                foodItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.querySelector('.quantity-scaler').classList.remove('active');
                    }
                });
            }
        });
    });

    // Close quantity scalers when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.food-item')) {
            document.querySelectorAll('.quantity-scaler').forEach(scaler => {
                scaler.classList.remove('active');
            });
        }
    });

    // Quantity buttons handling
    foodItems.forEach(item => {
        const minusBtn = item.querySelector('.minus');
        const plusBtn = item.querySelector('.plus');
        const quantityValue = item.querySelector('.quantity-value');

        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(quantityValue.textContent);
            if (value > 1) {
                quantityValue.textContent = value - 1;
                updateOrderSummary();
            }
        });

        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(quantityValue.textContent);
            quantityValue.textContent = value + 1;
            updateOrderSummary();
        });
    });

    // Order summary update
    function updateOrderSummary() {
        // This would be implemented based on your specific needs
        // Example: Calculate total, update order items, etc.
    }

    // Cancel order button - Navigate to welcome interface
    document.querySelector('.cancel-button').addEventListener('click', () => {
        // Clear selections
        document.querySelectorAll('.selected').forEach(item => {
            item.classList.remove('selected');
        });
        // Navigate to welcome interface
        window.location.href = 'welcomeinterface.html';
    });

    // View order button - Navigate to view order interface
    document.querySelector('.view-button').addEventListener('click', () => {
        window.location.href = 'vieworderinterface.html';
    });
});
