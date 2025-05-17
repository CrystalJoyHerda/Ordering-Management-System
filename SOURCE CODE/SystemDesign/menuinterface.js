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

    // Category switching functionality
    const categoryButtons = document.querySelectorAll('.category-button');
    const coffeeGrid = document.querySelector('.coffee-grid');
    const snacksGrid = document.querySelector('.snacks-grid');

    // Show coffee grid by default
    coffeeGrid.classList.add('active');
    categoryButtons[0].classList.add('active');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update button states
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show appropriate grid
            if (button.textContent.toLowerCase() === 'coffee') {
                coffeeGrid.classList.add('active');
                snacksGrid.classList.remove('active');
            } else {
                snacksGrid.classList.add('active');
                coffeeGrid.classList.remove('active');
            }
        });
    });    // Food item selection and quantity scaler handling
    const foodItems = document.querySelectorAll('.food-item');
    foodItems.forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const scaler = item.querySelector('.quantity-scaler');
        const minusBtn = item.querySelector('.minus');
        
        // Set initial quantity to 0
        quantityValue.textContent = '0';
        minusBtn.disabled = true;

        item.addEventListener('click', (e) => {
            // Don't trigger if clicking quantity buttons
            if (e.target.closest('.quantity-btn')) {
                e.stopPropagation();
                return;
            }

            // Deselect other items
            foodItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('selected');
                }
            });

            // Toggle selection of current item
            item.classList.toggle('selected');

            // If selecting item with 0 quantity, set to 1
            if (item.classList.contains('selected') && quantityValue.textContent === '0') {
                quantityValue.textContent = '1';
                minusBtn.disabled = false;
            }
            
            updateOrderSummary();
        });
    });

    // Prevent quantity buttons from closing the scaler
    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        scaler.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Add-on selection
    const addons = document.querySelectorAll('.addon-circle');
    addons.forEach(addon => {
        addon.addEventListener('click', () => {
            addon.classList.toggle('selected');
            updateOrderSummary();
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
    });    // Initialize all quantities to 0 and disable minus buttons
    document.querySelectorAll('.food-item').forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        quantityValue.textContent = '0';
        minusBtn.disabled = true;
    });

    // Handle quantity changes
    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        const minusBtn = scaler.querySelector('.minus');
        const plusBtn = scaler.querySelector('.plus');
        const valueSpan = scaler.querySelector('.quantity-value');
        const foodItem = scaler.closest('.food-item');

        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(valueSpan.textContent);
            if (value > 0) {
                value--;
                valueSpan.textContent = value;
                minusBtn.disabled = value === 0;
                
                if (value === 0) {
                    foodItem.classList.remove('selected');
                }
                
                updateOrderSummary();
            }
        });

        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(valueSpan.textContent);
            value++;
            valueSpan.textContent = value;
            minusBtn.disabled = false;
            foodItem.classList.add('selected');
            updateOrderSummary();
        });
    });

    function updateTotal() {
        let total = 0;
        document.querySelectorAll('.food-item').forEach(item => {
            const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            total += price * quantity;
        });
        document.getElementById('total-amount').textContent = `₱${total.toFixed(2)}`;
    }

    // Initialize total on page load
    document.addEventListener('DOMContentLoaded', () => {
        updateTotal();
    });
});
