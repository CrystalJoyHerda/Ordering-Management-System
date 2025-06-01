// Immediately disable text selection before DOM is loaded
(function() {
    const style = document.createElement('style');
    style.textContent = `
        * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-tap-highlight-color: transparent;
        }
        input, textarea, .editable-field {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    // Disable text selection globally
    document.onselectstart = function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('editable-field')) {
            return false;
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing interface...");
    
    // Update datetime function
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
            console.log("Order button clicked:", button.textContent);
            // Remove active class from all buttons
            orderButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#e0e0e0';  // Reset to default
            });
            // Add active class and change background for clicked button
            button.classList.add('active');
            button.style.backgroundColor = '#ffffff';

            // Save order type to localStorage for cashiering sync
            localStorage.setItem('pendingOrderType', button.textContent.trim());
        });
    });

    // Category switching functionality
    const categoryButtons = document.querySelectorAll('.category-button');
    const coffeeGrid = document.querySelector('.coffee-grid');
    const snacksGrid = document.querySelector('.snacks-grid');
    const rightSection = document.querySelector('.right-section');

    // Show coffee grid by default
    coffeeGrid.classList.add('active');
    categoryButtons[0].classList.add('active');
    rightSection.style.display = 'block'; // Show add-ons section by default for coffee

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update button states
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Don't deselect items with quantities, only clear visual selection for add-ons
            document.querySelectorAll('.food-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Reset and disable add-ons when switching categories
            resetAddons();
            disableAddons();
            
            // Clear selected item state for add-ons
            orderState.selectedItem = null;

            // Show appropriate grid and toggle add-ons section
            if (button.textContent.toLowerCase() === 'coffee') {
                coffeeGrid.classList.add('active');
                snacksGrid.classList.remove('active');
                rightSection.style.display = 'block';
            } else {
                snacksGrid.classList.add('active');
                coffeeGrid.classList.remove('active');
                rightSection.style.display = 'none'; // Hide add-ons section for snacks
            }
            
            // Update selected item display
            updateSelectedItemDisplay(null);
        });
    });

    // Food item selection and quantity scaler handling
    function setupFoodItemHandlers() {
        const foodItems = document.querySelectorAll('.food-item');
        
        foodItems.forEach(item => {
            const quantityValue = item.querySelector('.quantity-value');
            const minusBtn = item.querySelector('.minus');
            
            // Set initial state
            quantityValue.textContent = '0';
            minusBtn.disabled = true;

            // Remove any existing listeners first
            item.removeEventListener('click', handleFoodItemClick);
            
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking quantity buttons
                if (e.target.closest('.quantity-btn')) {
                    e.stopPropagation();
                    return;
                }

                // Handle food item selection for add-ons
                handleFoodItemClick(item);
            });
        });
    }

    // Add this near the top with other state variables
    const orderState = {
        selectedItem: null,
        itemAddons: new Map(), // Stores item -> addons mapping
    };

    // Replace the handleFoodItemClick function
    function handleFoodItemClick(item) {
        const category = item.closest('.coffee-grid') ? 'coffee' : 'snacks';
        const foodName = item.querySelector('.food-name').textContent;
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        
        // Determine drink category based on the item name and grid location
        const drinkCategory = getDrinkCategory(item, foodName);
        
        // Get current quantity
        let currentQuantity = parseInt(quantityValue.textContent) || 0;
        
        if (currentQuantity === 0) {
            // If quantity is 0, add 1
            currentQuantity = 1;
            quantityValue.textContent = currentQuantity;
            minusBtn.disabled = false;
            item.classList.add('selected', 'in-order');
            
            // Reset all add-ons first
            resetAddons();
            
            // Enable/disable add-ons based on drink category
            if (drinkCategory === 'hot-coffee' || drinkCategory === 'cold-coffee') {
                // Deselect other items visually for add-ons selection
                document.querySelectorAll('.food-item').forEach(foodItem => {
                    if (foodItem !== item) {
                        foodItem.classList.remove('selected');
                    }
                });
                
                // Update selected item state for add-ons
                orderState.selectedItem = foodName;
                enableAddons();
                // Restore any previously selected add-ons for this item
                restoreAddonSelections(foodName);
                updateSelectedItemDisplay(foodName);
            } else {
                // For non-coffee items, disable add-ons and show warning
                disableAddons();
                orderState.selectedItem = null;
                updateSelectedItemDisplay(null);
                showAddonWarning();
            }
        } else {
            // If quantity > 0, remove the item (set to 0)
            currentQuantity = 0;
            quantityValue.textContent = currentQuantity;
            minusBtn.disabled = true;
            item.classList.remove('selected', 'in-order');
            
            // Remove add-ons for this item
            orderState.itemAddons.delete(foodName);
            
            // If this was the selected item, clear selection
            if (orderState.selectedItem === foodName) {
                orderState.selectedItem = null;
                updateSelectedItemDisplay(null);
                disableAddons();
            }
        }
        
        // Show Add Item button when coffee item is selected
        const addItemBtn = document.querySelector('.add-item-btn');
        if (drinkCategory === 'hot-coffee' || drinkCategory === 'cold-coffee') {
            addItemBtn.style.display = 'block';
        } else {
            addItemBtn.style.display = 'none';
        }
        
        updateOrderSummary();
    }

    // New function to determine drink category
    function getDrinkCategory(item, foodName) {
        // Check if item is in coffee grid
        if (item.closest('.coffee-grid')) {
            // Determine if it's hot or cold coffee based on the section
            const gridHeadings = document.querySelectorAll('.coffee-grid .grid-heading');
            let currentCategory = 'hot-coffee'; // default
            
            for (let heading of gridHeadings) {
                const headingText = heading.textContent.toLowerCase();
                const itemElement = item;
                
                // Check if this item comes after a specific heading
                let currentElement = heading.nextElementSibling;
                while (currentElement && !currentElement.classList.contains('grid-heading')) {
                    if (currentElement === itemElement) {
                        if (headingText.includes('cold')) {
                            return 'cold-coffee';
                        } else if (headingText.includes('hot')) {
                            return 'hot-coffee';
                        } else if (headingText.includes('non')) {
                            return 'non-coffee';
                        }
                        break;
                    }
                    currentElement = currentElement.nextElementSibling;
                }
            }
            
            // Additional check based on item name for more accuracy
            const itemNameLower = foodName.toLowerCase();
            if (itemNameLower.includes('iced') || itemNameLower.includes('cold') || itemNameLower.includes('frappuccino') || itemNameLower.includes('affogato')) {
                return 'cold-coffee';
            } else if (itemNameLower.includes('italian soda') || itemNameLower.includes('fizz') || itemNameLower.includes('spritzer') || itemNameLower.includes('cooler') || itemNameLower.includes('basil soda')) {
                return 'non-coffee';
            }
            
            return currentCategory;
        } else {
            // Items in snacks grid are non-coffee
            return 'non-coffee';
        }
    }

    // New function to show add-on warning
    function showAddonWarning() {
        const selectedItemName = document.querySelector('.selected-item-name');
        if (selectedItemName) {
            const originalText = selectedItemName.textContent;
            selectedItemName.textContent = '⚠️ Add-ons only for Hot & Cold Coffee';
            selectedItemName.style.color = '#f44336';
            selectedItemName.style.animation = 'flash 0.5s 3';
            
            // Reset text after 3 seconds
            setTimeout(() => {
                selectedItemName.textContent = 'Select an item first';
                selectedItemName.style.color = '';
                selectedItemName.style.animation = '';
            }, 3000);
        }
    }

    function enableAddons() {
        const addons = document.querySelectorAll('.addon-circle');
        addons.forEach(addon => {
            addon.classList.remove('disabled');
            addon.style.opacity = '1';
            addon.style.pointerEvents = 'auto';
            addon.style.cursor = 'pointer';
        });
    }

    function disableAddons() {
        const addons = document.querySelectorAll('.addon-circle');
        addons.forEach(addon => {
            addon.classList.add('disabled');
            addon.classList.remove('selected');
            addon.style.opacity = '0.3';
            addon.style.pointerEvents = 'none';
            addon.style.cursor = 'not-allowed';
        });
    }

    function resetAddons() {
        const addons = document.querySelectorAll('.addon-circle');
        addons.forEach(addon => {
            addon.classList.remove('selected');
        });
    }

    function restoreAddonSelections(itemName) {
        resetAddons();
        const itemAddons = orderState.itemAddons.get(itemName) || [];
        itemAddons.forEach(addonName => {
            const addon = document.querySelector(`.addon-circle[data-name="${addonName}"]`);
            if (addon) {
                addon.classList.add('selected');
            }
        });
    }

    function updateSelectedItemDisplay(itemName) {
        const display = document.querySelector('.selected-item-name');
        if (display) {
            display.textContent = itemName || 'Select an item first';
            display.classList.toggle('none-selected', !itemName);
        }
    }

    // Initial setup
    setupFoodItemHandlers();

    // Prevent quantity buttons from closing the scaler
    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        scaler.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });    // Add-on selection - improved to ensure proper item association and only for coffee items
    const addons = document.querySelectorAll('.addon-circle');
    addons.forEach(addon => {
        addon.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            const addonName = this.getAttribute('data-name');
            const itemName = orderState.selectedItem;
            
            if (!itemName) {
                // Flash the selected item display if no item selected
                const selectedItemName = document.querySelector('.selected-item-name');
                selectedItemName.style.animation = 'flash 0.5s 2';
                return;
            }
            
            // Check if the selected item has quantity > 0
            const selectedFoodItem = document.querySelector('.food-item.selected');
            const quantity = parseInt(selectedFoodItem.querySelector('.quantity-value').textContent);
            
            if (quantity === 0) {
                // Flash message if item quantity is 0
                const selectedItemName = document.querySelector('.selected-item-name');
                selectedItemName.style.animation = 'flash 0.5s 2';
                return;
            }
            
            this.classList.toggle('selected');
            
            // Update stored add-ons for this item
            let itemAddons = orderState.itemAddons.get(itemName) || [];
            if (this.classList.contains('selected')) {
                if (!itemAddons.includes(addonName)) {
                    itemAddons.push(addonName);
                }
            } else {
                itemAddons = itemAddons.filter(name => name !== addonName);
            }
            orderState.itemAddons.set(itemName, itemAddons);
            
            console.log(`Item: ${itemName}, Add-ons:`, itemAddons);
        });
    });    // Add a flash animation for the selected item display and disable text selection globally
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flash {
            0% { background-color: #f0f0f0; }
            50% { background-color: #ffdddd; }
            100% { background-color: #f0f0f0; }
        }
        
        /* Global style to prevent text selection and highlighting */
        html, body, div, span, h1, h2, h3, h4, h5, h6, p, 
        a, button, img, ul, li, header, footer, nav,
        .container, .header, .main-layout, .food-grid,
        .view-order-modal, .modal-content, .order-item,
        .datetime, .order-type, .left-section, .center-section, 
        .right-section, .order-summary, .footer {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Disable highlighting when tapping on mobile */
        * {
            -webkit-tap-highlight-color: transparent;
        }
        
        /* Add specific styles for clickable elements to ensure they respond */
        button, .order-button, .category-button, .option-btn, 
        .quantity-btn, .confirm-modal-btn, .cancel-modal-btn, .close-modal, 
        .close-notification-modal, .notification-ok-btn, .close-thank-you-btn {
            cursor: pointer;
            pointer-events: auto !important;
        }
        
        /* Make sure modals display properly */
        .notification-modal, .view-order-modal, .thank-you-modal, #confirmationModal {
            position: fixed;
            z-index: 9999;
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Order summary update function
    function updateOrderSummary() {
        // Get all items with quantity > 0
        const selectedItems = [];
        
        console.log("Beginning updateOrderSummary...");
        
        // First collect all items
        document.querySelectorAll('.food-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            
            // Update visual indicator based on quantity
            if (quantity > 0) {
                item.classList.add('in-order');  // Add visual indicator for items in the order
                
                const name = item.querySelector('.food-name').textContent;
                const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
                
                console.log(`Processing item: ${name}, quantity: ${quantity}`);
                
                // Create item entry with empty add-ons array
                const itemEntry = {
                    name,
                    price,
                    quantity,
                    total: price * quantity,
                    addons: []
                };
                
                selectedItems.push(itemEntry);
            } else {
                item.classList.remove('in-order');
            }
        });
        
        // Get ALL add-ons that have data-for-item attribute, not just visually selected ones
        const allAddons = document.querySelectorAll('.addon-circle[data-for-item]');
        console.log(`Found ${allAddons.length} associated add-ons`);
        
        // Process all associated add-ons
        allAddons.forEach(addon => {
            const addonName = addon.getAttribute('data-name');
            const addonPrice = parseFloat(addon.getAttribute('data-price'));
            const forItem = addon.getAttribute('data-for-item');
            
            console.log(`Add-on: ${addonName}, Price: ${addonPrice}, For item: ${forItem || 'None'}`);
            
            // Only process add-ons that are associated with a specific item
            if (forItem) {
                // Find the corresponding item in our array
                const itemIndex = selectedItems.findIndex(item => item.name === forItem);
                
                if (itemIndex !== -1) {
                    console.log(`Adding add-on ${addonName} to ${forItem}`);
                    
                    // Add this add-on to the item's add-ons array
                    selectedItems[itemIndex].addons.push({
                        name: addonName,
                        price: addonPrice
                    });
                    
                    // Update the item's total price to include the add-on
                    selectedItems[itemIndex].total += addonPrice * selectedItems[itemIndex].quantity;
                } else {
                    console.warn(`Item ${forItem} not found for add-on ${addonName}`);
                }
            }
        });
        
        // Save to localStorage for access across pages
        localStorage.setItem('orderItems', JSON.stringify(selectedItems));
        return selectedItems;
    }

    // Function to populate the order modal
    function populateOrderModal() {
        console.log('Populating order modal...');
        
        // Get the order items
        const orderItems = updateOrderSummary();
        console.log('Order items:', orderItems);
        
        // Get the modal body elements
        const orderTypeDisplay = document.querySelector('.order-type-display');
        const orderItemsContainer = document.querySelector('.order-items');
        const orderTotalContainer = document.querySelector('.order-total');
        
        // Clear previous content
        orderItemsContainer.innerHTML = '';
        
        // Display the selected order type
        const activeOrderType = document.querySelector('.order-button.active');
        if (activeOrderType) {
            const orderTypeText = activeOrderType.textContent.trim();
            orderTypeDisplay.textContent = `Order Type: ${orderTypeText}`;
            console.log('Set order type display to:', orderTypeText);
        } else {
            orderTypeDisplay.textContent = 'Please select an order type';
            console.log('No active order type found');
        }
        
        // Add items to the container
        let total = 0;
        let itemsHtml = '<ul class="order-item-list">';
        
        orderItems.forEach(item => {
            const basePrice = item.price * item.quantity;
            let addonTotal = 0;
            let addonHtml = '';
            
            // Get add-ons for this item
            const itemAddons = orderState.itemAddons.get(item.name) || [];
            if (itemAddons.length > 0) {
                addonHtml = '<div class="item-addons">';
                itemAddons.forEach(addonName => {
                    const addon = document.querySelector(`.addon-circle[data-name="${addonName}"]`);
                    if (addon) {
                        const addonPrice = parseFloat(addon.getAttribute('data-price'));
                        addonTotal += addonPrice * item.quantity;
                        
                        addonHtml += `
                            <div class="addon-item">
                                + ${addonName} (₱${addonPrice.toFixed(2)} × ${item.quantity})
                            </div>
                        `;
                    }
                });
                addonHtml += '</div>';
            }
            
            const itemTotal = basePrice + addonTotal;
            total += itemTotal;
            
            // Add the item to the HTML
            itemsHtml += `
                <li class="order-item" data-name="${item.name}">
                    <div class="item-main">
                        <span class="item-quantity">${item.quantity}x</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">₱${basePrice.toFixed(2)}</span>
                    </div>
                    ${addonHtml}
                    <div class="item-total">₱${itemTotal.toFixed(2)}</div>
                </li>
            `;
        });
        
        itemsHtml += '</ul>';
        orderItemsContainer.innerHTML = itemsHtml;
        orderTotalContainer.textContent = `Total: ₱${total.toFixed(2)}`;
        
        // Add click handlers to remove items
        document.querySelectorAll('.order-item').forEach(item => {
            item.addEventListener('click', function() {
                const itemName = this.getAttribute('data-name');
                showRemoveConfirmation(itemName);
            });
        });
        
        console.log('Order modal populated with', orderItems.length, 'items');
    }

    // View order button click handler
    document.querySelector('.view-button').addEventListener('click', () => {
        console.log("View order button clicked - MAIN HANDLER");
        
        // Get stored items (from Add Item button)
        const storedItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        console.log('Stored items from Add Button:', storedItems);
        
        // Get current quantity-based items (from +/- buttons directly)  
        const quantityItems = getCurrentQuantityItems();
        console.log('Current quantity items:', quantityItems);
        
        // Combine all items
        const allOrderItems = [...storedItems, ...quantityItems];
        console.log('Combined order items:', allOrderItems);
        
        if (allOrderItems.length === 0) {
            console.log("No items in order, showing empty modal");
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check order type
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            console.log("No order type selected, showing order type modal");
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Show view order modal with all items
        console.log("Showing order modal with items:", allOrderItems);
        populateOrderModalWithAllItems(allOrderItems);
        document.getElementById('viewOrderModal').style.display = 'flex';
    });

    // Handle order type modal close button
    document.querySelector('#orderTypeModal .close-notification-modal').addEventListener('click', () => {
        console.log("Order type modal close button clicked");
        document.getElementById('orderTypeModal').style.display = 'none';
    });

    // Handle order type selection from modal
    document.querySelectorAll('#orderTypeModal .option-btn').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Order type button clicked:', this.getAttribute('data-type'));
            
            // Get the order type from data attribute
            const orderType = this.getAttribute('data-type');
            
            // Find and activate the corresponding order button in the header
            document.querySelectorAll('.order-button').forEach(btn => {
                if (btn.textContent.trim() === orderType.trim()) {
                    // Set this button as active
                    btn.classList.add('active');
                    btn.style.backgroundColor = '#ffffff';
                    // Save order type to localStorage
                    localStorage.setItem('pendingOrderType', btn.textContent.trim());
                } else {
                    // Deactivate other buttons
                    btn.classList.remove('active');
                    btn.style.backgroundColor = '#e0e0e0';
                }
            });
            
            // Hide the order type modal immediately
            document.getElementById('orderTypeModal').style.display = 'none';
            
            // Show the view order modal
            setTimeout(function() {
                populateOrderModal();
                document.getElementById('viewOrderModal').style.display = 'flex';
            }, 50);
        });
    });

    // Empty order modal OK button
    document.querySelector('.notification-ok-btn').addEventListener('click', () => {
        console.log("Empty order modal OK button clicked");
        document.getElementById('emptyOrderModal').style.display = 'none';
    });

    // Function to show confirmation for removing an item
    function showRemoveConfirmation(itemName) {
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmationMessage = document.getElementById('confirmationMessage');
        
        confirmationMessage.textContent = `Are you sure you want to remove "${itemName}" from your order?`;
        confirmationModal.style.display = 'flex';
        
        // Set up buttons
        document.getElementById('confirmYes').onclick = function() {
            removeItemFromOrder(itemName);
            confirmationModal.style.display = 'none';
        };
        
        document.getElementById('confirmCancel').onclick = function() {
            confirmationModal.style.display = 'none';
        };
    }
    
    // Update the removeItemFromOrder function
    function removeItemFromOrder(itemName) {
        // Find the item in the menu and reset its quantity
        document.querySelectorAll('.food-item').forEach(item => {
            const name = item.querySelector('.food-name').textContent;
            if (name === itemName) {
                item.querySelector('.quantity-value').textContent = '0';
                item.querySelector('.quantity-btn.minus').disabled = true;
                item.classList.remove('in-order', 'selected');
            }
        });
        
        // Remove add-ons for this item
        orderState.itemAddons.delete(itemName);
        
        // If this was the selected item, clear selection
        if (orderState.selectedItem === itemName) {
            orderState.selectedItem = null;
            updateSelectedItemDisplay(null);
            disableAddons();
        }
        
        // Update order summary and repopulate the modal
        updateOrderSummary();
        populateOrderModal();
    }    // Modal control buttons - Fix the order confirmation flow
    document.querySelector('.confirm-modal-btn').addEventListener('click', async () => {
        console.log("Confirm order button clicked");
        
        // Get the order items
        const orderItems = updateOrderSummary();
        
        if (orderItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Disable confirm button to prevent double submission
        const confirmBtn = document.querySelector('.confirm-modal-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        
        try {
            // Submit order to database
            const orderData = await submitOrderToDatabase(orderItems, orderType.textContent.trim());
            
            if (orderData.success) {
                // Save order data to localStorage
                localStorage.setItem('orderType', orderType.textContent);
                localStorage.setItem('lastOrderNumber', orderData.order_number);
                
                // Update order number in Thank You Modal
                document.getElementById('orderNumber').textContent = orderData.order_number;
                
                // Close the view order modal and show the thank you modal
                document.getElementById('viewOrderModal').style.display = 'none';
                document.getElementById('thankYouModal').style.display = 'flex';
                
                console.log('Order submitted successfully:', orderData);
            } else {
                throw new Error(orderData.message || 'Failed to submit order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order: ' + error.message + '\nPlease try again.');
        } finally {
            // Re-enable confirm button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Order';
        }
    });

    // Handle Thank You Modal close button - Update to go back to welcome screen
    document.querySelector('.close-thank-you-btn').addEventListener('click', function() {
        console.log("Thank you modal close button clicked");
        
        // Check if we're already showing the success message
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // If success message is already showing (receipt printed), go directly to welcome page
        if (loadingSpinner.innerHTML.includes('Receipt printed successfully')) {
            window.location.href = 'welcomeinterface.html';
            return;
        }
        
        // Otherwise, start the printing process
        loadingSpinner.classList.add('active');
        
        // Disable the OK button to prevent multiple clicks during printing
        this.disabled = true;
        
        // Clear the order data from localStorage
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        
        // Add a delay to simulate printing the receipt (3 seconds)
        setTimeout(() => {
            // Show a success message instead of the spinner
            loadingSpinner.innerHTML = '<p class="success-message" style="font-size: 18px; color: #388e3c; font-weight: bold;">✓ Receipt printed successfully!</p><p>Please proceed to the cashier.</p>';
            
            // Re-enable the OK button so it can be clicked to immediately go to welcome page
            document.querySelector('.close-thank-you-btn').disabled = false;
            document.querySelector('.close-thank-you-btn').textContent = 'Return to Home';
            
            // Still add a fallback automatic redirect after 8 seconds in case user doesn't click
            setTimeout(() => {
                window.location.href = 'welcomeinterface.html';
            }, 8000);
        }, 3000);
    });

    // Cancel order button - Navigate to welcome interface
    document.querySelector('.cancel-button').addEventListener('click', () => {
        console.log("Cancel order button clicked");
        
        // Clear selections
        document.querySelectorAll('.selected').forEach(item => {
            item.classList.remove('selected');
        });
        // Navigate to welcome interface
        window.location.href = 'welcomeinterface.html';
    });

    // Initialize quantities and handle quantity changes
    document.querySelectorAll('.food-item').forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        quantityValue.textContent = '0';
        minusBtn.disabled = true;
    });

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
                    foodItem.classList.remove('in-order');  // Remove in-order indicator when quantity is 0
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
            foodItem.classList.add('in-order');  // Add in-order indicator when quantity > 0
            updateOrderSummary();
        });
    });

    // Function to update the total shown in the UI
    function updateTotal() {
        let total = 0;
        document.querySelectorAll('.food-item').forEach(item => {
            const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            total += price * quantity;
        });
        
        // Check if total-amount element exists
        const totalElement = document.getElementById('total-amount');
        if (totalElement) {
            totalElement.textContent = `₱${total.toFixed(2)}`;
        }
    }

    // Initialize total on page load
    updateTotal();    // Prevent dragging and text selection for all elements in the document
    const preventDragging = () => {
        console.log("Setting up drag prevention");
        
        // Apply to all elements in the document
        const allElements = document.querySelectorAll('*');
        
        // Add global event listeners to the document
        document.addEventListener('selectstart', (e) => {
            // Allow selection only on inputs and textareas
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('editable-field')) {
                e.preventDefault();
                return false;
            }
        });
        
        document.addEventListener('dragstart', (e) => {
            // Allow dragging only for elements that should be draggable
            if (!e.target.hasAttribute('draggable') || e.target.getAttribute('draggable') === 'false') {
                e.preventDefault();
                return false;
            }
        });
        
        // Make sure all images are not draggable
        document.querySelectorAll('img').forEach(img => {
            img.setAttribute('draggable', 'false');
            img.style.pointerEvents = 'none'; // Prevent image dragging
        });
        
        // Make sure all buttons have pointer events enabled
        document.querySelectorAll('button, .order-button, .category-button, .option-btn').forEach(btn => {
            btn.style.pointerEvents = 'auto';
        });
    };
    
    // Call the function initially
    preventDragging();
    
    // Apply drag prevention after any dynamic content is added
    document.addEventListener('click', function(e) {
        // Wait a short time after any click to catch new elements
        if (e.target.closest('.view-button') || e.target.closest('.option-btn')) {
            setTimeout(preventDragging, 100);
        }
    });
    
    // Load pending order from cashiering if present
    const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || 'null');
    if (pendingOrder && Array.isArray(pendingOrder.currentItems)) {
        // Pre-populate the menu quantities
        document.querySelectorAll('.food-item').forEach(item => {
            const foodName = item.querySelector('.food-name').textContent;
            const found = pendingOrder.currentItems.find(i => i.name === foodName);
            const quantityValue = item.querySelector('.quantity-value');
            const minusBtn = item.querySelector('.minus');
            if (found) {
                quantityValue.textContent = found.quantity;
                minusBtn.disabled = found.quantity == 0;
                if (found.quantity > 0) {
                    item.classList.add('in-order');
                }
            } else {
                quantityValue.textContent = '0';
                minusBtn.disabled = true;
                item.classList.remove('in-order');
            }
        });
        // Restore order type if present
        const pendingOrderType = localStorage.getItem('pendingOrderType');
        if (pendingOrderType) {
            document.querySelectorAll('.order-button').forEach(btn => {
                if (btn.textContent.trim().toLowerCase() === pendingOrderType.trim().toLowerCase()) {
                    btn.classList.add('active');
                    btn.style.backgroundColor = '#ffffff';
                } else {
                    btn.classList.remove('active');
                    btn.style.backgroundColor = '#e0e0e0';
                }
            });
        }
        // Remove pendingOrder so it doesn't reload again
        localStorage.removeItem('pendingOrder');
    }
    
    console.log("Menu interface initialization complete");

    // Function to submit order to database
    async function submitOrderToDatabase(orderItems, orderType) {
        try {
            // Prepare order data for backend
            const orderData = {
                order_type: orderType.toLowerCase(),
                customer_name: null, // Can be extended later to capture customer name
                items: orderItems.map(item => ({
                    product_name: item.name,
                    product_id: null, // Will be resolved by backend
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.total,
                    addons: item.addons || []
                }))
            };            console.log('Submitting order to database:', orderData);            // Submit to backend API (XAMPP htdocs path)
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/orders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Backend response:', result);
            
            if (result.status === 'success') {
                return {
                    success: true,
                    order_number: result.data.order_number,
                    order_id: result.data.id,
                    total_amount: result.data.total_amount
                };
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
            
        } catch (error) {
            console.error('Error submitting order to database:', error);
            throw error;
        }
    }

    // View Order Modal close handlers
    const viewOrderModal = document.getElementById('viewOrderModal');
    const cancelButton = viewOrderModal?.querySelector('.cancel-modal-btn');
    const closeButton = viewOrderModal?.querySelector('.close-modal');
    
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Close modal and return to menu
            closeViewOrderModalAndReturn();
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeViewOrderModalAndReturn();
        });
    }
    
    // Close when clicking outside modal
    viewOrderModal?.addEventListener('click', function(e) {
        if (e.target === viewOrderModal) {
            closeViewOrderModalAndReturn();
        }
    });
    
    // FIXED: Add Item button click handler - Place it after other handlers
    const addItemBtn = document.querySelector('.add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            console.log("Add Item button clicked");
            
            const currentItem = orderState.selectedItem;
            if (!currentItem) {
                console.log("No item selected");
                return;
            }

            const selectedFoodItem = document.querySelector('.food-item.selected');
            if (!selectedFoodItem) {
                console.log("No selected food item found");
                return;
            }

            // Get item details
            const itemQuantity = parseInt(selectedFoodItem.querySelector('.quantity-value').textContent);
            const itemPrice = parseFloat(selectedFoodItem.querySelector('.food-price').textContent.replace('₱', ''));

            // Get currently selected add-ons and their prices
            const selectedAddons = [...document.querySelectorAll('.addon-circle.selected')].map(addon => ({
                name: addon.getAttribute('data-name'),
                price: parseFloat(addon.getAttribute('data-price'))
            }));

            console.log(`Adding item: ${currentItem}, Quantity: ${itemQuantity}, Add-ons:`, selectedAddons);

            // Calculate total price including add-ons
            const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
            const totalPrice = (itemPrice + addonTotal) * itemQuantity;

            // Create order item object
            const orderItem = {
                name: currentItem,
                price: itemPrice,
                quantity: itemQuantity,
                addons: selectedAddons,
                total: totalPrice,
                source: 'add-button' // Mark this as added via button
            };

            // Get existing stored items from localStorage
            const existingStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
            existingStoredItems.push(orderItem);
            
            // Save updated stored items back to localStorage
            localStorage.setItem('storedOrderItems', JSON.stringify(existingStoredItems));

            // Build notification message
            const addonText = selectedAddons.length > 0 
                ? ` with ${selectedAddons.length} add-on${selectedAddons.length > 1 ? 's' : ''}` 
                : '';
            const message = `✓ Added ${currentItem}${addonText}`;

            // Reset interface state for this item
            selectedFoodItem.querySelector('.quantity-value').textContent = '0';
            selectedFoodItem.querySelector('.minus').disabled = true;
            selectedFoodItem.classList.remove('selected', 'in-order');
            
            // Reset add-ons
            resetAddons();
            disableAddons();
            updateSelectedItemDisplay(null);
            addItemBtn.style.display = 'none';
            
            // Clear the item's add-ons from orderState
            orderState.itemAddons.delete(currentItem);
            orderState.selectedItem = null;

            // Show success notification
            showSuccessNotification(message);

            console.log('Item added to stored items:', orderItem);
            console.log('Current stored items:', JSON.parse(localStorage.getItem('storedOrderItems') || '[]'));
        });
    }

    // UPDATED: View order button click handler - Remove redundant empty check
    document.querySelector('.view-button').addEventListener('click', () => {
        console.log("View order button clicked - MAIN HANDLER");
        
        // Get stored items (from Add Item button)
        const storedItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        console.log('Stored items from Add Button:', storedItems);
        
        // Get current quantity-based items (from +/- buttons directly)  
        const quantityItems = getCurrentQuantityItems();
        console.log('Current quantity items:', quantityItems);
        
        // Combine all items
        const allOrderItems = [...storedItems, ...quantityItems];
        console.log('Combined order items:', allOrderItems);
        
        if (allOrderItems.length === 0) {
            console.log("No items in order, showing empty modal");
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check order type
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            console.log("No order type selected, showing order type modal");
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Show view order modal with all items
        console.log("Showing order modal with items:", allOrderItems);
        populateOrderModalWithAllItems(allOrderItems);
        document.getElementById('viewOrderModal').style.display = 'flex';
    });

    // UPDATED: Confirm order to use combined items - Remove redundant empty check
    document.querySelector('.confirm-modal-btn').addEventListener('click', async () => {
        console.log("Confirm order button clicked");
        
        // Get all items (stored + quantity-based)
        const storedItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        const quantityItems = getCurrentQuantityItems();
        const allOrderItems = [...storedItems, ...quantityItems];
        
        console.log("All order items for confirmation:", allOrderItems);
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Disable confirm button to prevent double submission
        const confirmBtn = document.querySelector('.confirm-modal-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        
        try {
            // Submit order to database
            const orderData = await submitOrderToDatabase(allOrderItems, orderType.textContent.trim());
            
            if (orderData.success) {
                // Clear both stored items and quantity items after successful submission
                localStorage.removeItem('storedOrderItems');
                
                // Reset quantity items in the interface
                document.querySelectorAll('.food-item').forEach(item => {
                    item.querySelector('.quantity-value').textContent = '0';
                    const minusBtn = item.querySelector('.quantity-btn.minus');
                    if (minusBtn) minusBtn.disabled = true;
                    item.classList.remove('in-order', 'selected');
                });
                
                // Clear all add-ons and selections
                orderState.itemAddons.clear();
                orderState.selectedItem = null;
                resetAddons();
                disableAddons();
                updateSelectedItemDisplay(null);
                
                // Hide the add item button
                const addItemBtn = document.querySelector('.add-item-btn');
                if (addItemBtn) addItemBtn.style.display = 'none';
                
                // Save order data to localStorage
                localStorage.setItem('orderType', orderType.textContent);
                localStorage.setItem('lastOrderNumber', orderData.order_number);
                
                // Update order number in Thank You Modal
                document.getElementById('orderNumber').textContent = orderData.order_number;
                
                // Close the view order modal and show the thank you modal
                document.getElementById('viewOrderModal').style.display = 'none';
                document.getElementById('thankYouModal').style.display = 'flex';
                
                console.log('Order submitted successfully:', orderData);
            } else {
                throw new Error(orderData.message || 'Failed to submit order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order: ' + error.message + '\nPlease try again.');
        } finally {
            // Re-enable confirm button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Order';
        }
    });

    // UPDATED: Function to remove items based on their source - Fix indexing issue
    function removeItemFromOrderBySource(itemName, itemIndex, itemSource) {
        console.log(`Removing item: ${itemName}, index: ${itemIndex}, source: ${itemSource}`);
        
        if (itemSource === 'add-button') {
            // Remove from stored items
            let storedItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
            
            // Find the correct index in the STORED items array, not the combined array
            const storedItemIndex = storedItems.findIndex((item, idx) => 
                item.name === itemName && idx.toString() === itemIndex.toString()
            );
            
            if (storedItemIndex !== -1) {
                storedItems.splice(storedItemIndex, 1);
                localStorage.setItem('storedOrderItems', JSON.stringify(storedItems));
                console.log('Updated stored items:', storedItems);
            } else {
                // Fallback: remove by name
                storedItems = storedItems.filter(item => item.name !== itemName);
                localStorage.setItem('storedOrderItems', JSON.stringify(storedItems));
                console.log('Removed by name, updated stored items:', storedItems);
            }
        } else if (itemSource === 'quantity-buttons') {
            // Remove from quantity-based items
            document.querySelectorAll('.food-item').forEach(item => {
                const name = item.querySelector('.food-name').textContent;
                if (name === itemName) {
                    item.querySelector('.quantity-value').textContent = '0';
                    const minusBtn = item.querySelector('.quantity-btn.minus');
                    if (minusBtn) minusBtn.disabled = true;
                    item.classList.remove('in-order', 'selected');
                }
            });
            
            // Remove add-ons for this item
            orderState.itemAddons.delete(itemName);
            
            // If this was the selected item, clear selection
            if (orderState.selectedItem === itemName) {
                orderState.selectedItem = null;
                updateSelectedItemDisplay(null);
                disableAddons();
            }
        }
        
        // Get updated items and repopulate modal
        const storedItemsUpdated = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        const quantityItems = getCurrentQuantityItems();
        const allItems = [...storedItemsUpdated, ...quantityItems];
        
        console.log('All items after removal:', allItems);
        
        if (allItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
        } else {
            // Re-index the items properly for the modal
            const reIndexedItems = allItems.map((item, newIndex) => ({
                ...item,
                modalIndex: newIndex
            }));
            populateOrderModalWithAllItems(reIndexedItems);
        }
    }

    // UPDATED: Function to populate modal with all items - Fix indexing
    function populateOrderModalWithAllItems(orderItems) {
        console.log('Populating order modal with all items:', orderItems);
        
        const orderTypeDisplay = document.querySelector('.order-type-display');
        const orderItemsContainer = document.querySelector('.order-items');
        const orderTotalContainer = document.querySelector('.order-total');
        
        if (!orderItemsContainer) {
            console.error('Order items container not found');
            return;
        }
        
        // Clear previous content
        orderItemsContainer.innerHTML = '';
        
        // Display the selected order type
        const activeOrderType = document.querySelector('.order-button.active');
        if (activeOrderType && orderTypeDisplay) {
            const orderTypeText = activeOrderType.textContent.trim();
            orderTypeDisplay.textContent = `Order Type: ${orderTypeText}`;
        } else if (orderTypeDisplay) {
            orderTypeDisplay.textContent = 'Please select an order type';
        }
        
        // Add items to the container
        let total = 0;
        let itemsHtml = '<ul class="order-item-list" style="list-style: none; padding: 0; margin: 0;">';
        
        orderItems.forEach((item, index) => {
            const basePrice = item.price * item.quantity;
            let addonTotal = 0;
            let addonHtml = '';
            
            // Handle add-ons
            if (item.addons && item.addons.length > 0) {
                addonHtml = '<div class="item-addons" style="margin-left: 15px; margin-top: 8px; background-color: #f9f9f9; padding: 8px; border-radius: 4px; border-left: 3px solid #4A2C1B;">';
                item.addons.forEach(addon => {
                    const addonCost = addon.price * item.quantity;
                    addonTotal += addonCost;
                    addonHtml += `
                        <div class="addon-item" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 0.9em; color: #666;">
                            <span style="font-style: italic;">+ ${addon.name}</span>
                            <span>₱${addonCost.toFixed(2)}</span>
                        </div>
                    `;
                });
                addonHtml += '</div>';
            }
            
            const itemTotal = basePrice + addonTotal;
            total += itemTotal;
            
            // Add source indicator for debugging
            const sourceText = item.source === 'add-button' ? ' (Added via Button)' : ' (Quantity Selector)';
            
            // Add the item to the HTML
            itemsHtml += `
                <li class="order-item" data-name="${item.name}" data-index="${index}" data-source="${item.source}" style="
                    background-color: white;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #eee;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <div class="item-main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="item-quantity" style="background: #4A2C1B; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">${item.quantity}x</span>
                            <span class="item-name" style="font-weight: bold; color: #4A2C1B;">${item.name}</span>
                            <span class="source-indicator" style="font-size: 0.7em; color: #999; font-style: italic;">${sourceText}</span>
                        </div>
                        <span class="item-price" style="color: #666; font-weight: 500;">₱${basePrice.toFixed(2)}</span>
                    </div>
                    ${addonHtml}
                    <div class="item-total" style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc; font-weight: bold; color: #4A2C1B;">
                        <span>Subtotal:</span>
                        <span>₱${itemTotal.toFixed(2)}</span>
                    </div>
                </li>
            `;
        });
        
        itemsHtml += '</ul>';
        orderItemsContainer.innerHTML = itemsHtml;
        
        if (orderTotalContainer) {
            orderTotalContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #4A2C1B; padding: 15px 0; border-top: 2px solid #4A2C1B;">
                    <span>Total Amount:</span>
                    <span>₱${total.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Add click handlers to remove items
        document.querySelectorAll('.order-item').forEach(item => {
            item.addEventListener('click', function() {
                const itemName = this.getAttribute('data-name');
                const itemIndex = this.getAttribute('data-index');
                const itemSource = this.getAttribute('data-source');
                console.log(`Clicked to remove item: ${itemName} at index ${itemIndex} from source ${itemSource}`);
                showRemoveConfirmationForItem(itemName, itemIndex, itemSource);
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#fff8f8';
                this.style.borderColor = '#ffcccc';
                this.style.transform = 'scale(1.02)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
                this.style.borderColor = '#eee';
                this.style.transform = 'scale(1)';
            });
        });
        
        console.log('Order modal populated successfully with', orderItems.length, 'items');
    }

    // UPDATED: Function to show confirmation for removing an item
    function showRemoveConfirmationForItem(itemName, itemIndex, itemSource) {
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmationMessage = document.getElementById('confirmationMessage');
        
        confirmationMessage.textContent = `Are you sure you want to remove "${itemName}" from your order?`;
        confirmationModal.style.display = 'flex';
        
        // Set up buttons
        document.getElementById('confirmYes').onclick = function() {
            removeItemFromOrderBySource(itemName, itemIndex, itemSource);
            confirmationModal.style.display = 'none';
        };
        
        document.getElementById('confirmCancel').onclick = function() {
            confirmationModal.style.display = 'none';
        };
    }

    // UPDATED: Function to remove items based on their source
    function removeItemFromOrderBySource(itemName, itemIndex, itemSource) {
        console.log(`Removing item: ${itemName}, index: ${itemIndex}, source: ${itemSource}`);
        
        if (itemSource === 'add-button') {
            // Remove from stored items
            let storedItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
            if (itemIndex !== undefined) {
                storedItems.splice(parseInt(itemIndex), 1);
            } else {
                storedItems = storedItems.filter(item => item.name !== itemName);
            }
            localStorage.setItem('storedOrderItems', JSON.stringify(storedItems));
            console.log('Updated stored items:', storedItems);
        } else if (itemSource === 'quantity-buttons') {
            // Remove from quantity-based items
            document.querySelectorAll('.food-item').forEach(item => {
                const name = item.querySelector('.food-name').textContent;
                if (name === itemName) {
                    item.querySelector('.quantity-value').textContent = '0';
                    const minusBtn = item.querySelector('.quantity-btn.minus');
                    if (minusBtn) minusBtn.disabled = true;
                    item.classList.remove('in-order', 'selected');
                }
            });
            
            // Remove add-ons for this item
            orderState.itemAddons.delete(itemName);
            
            // If this was the selected item, clear selection
            if (orderState.selectedItem === itemName) {
                orderState.selectedItem = null;
                updateSelectedItemDisplay(null);
                disableAddons();
            }
        }
        
        // Get updated items and repopulate modal
        const storedItemsUpdated = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        const quantityItems = getCurrentQuantityItems();
        const allItems = [...storedItemsUpdated, ...quantityItems];
        
        console.log('All items after removal:', allItems);
        
        if (allItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
        } else {
            populateOrderModalWithAllItems(allItems);
        }
    }

    // Function to close modal and return to menu
    function closeViewOrderModalAndReturn() {
        const modal = document.getElementById('viewOrderModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    // Function to show success notification
    function showSuccessNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.success-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'success-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and show
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Hide after 2 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }

    // NEW: Function to get current quantity-based items (items with quantity > 0)
    function getCurrentQuantityItems() {
        const quantityItems = [];
        
        document.querySelectorAll('.food-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            
            if (quantity > 0) {
                const name = item.querySelector('.food-name').textContent;
                const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
                
                // Get add-ons for this item from orderState (stored add-ons)
                let itemAddons = [];
                const storedAddons = orderState.itemAddons.get(name) || [];
                
                // Convert stored addon names to full addon objects
                storedAddons.forEach(addonName => {
                    const addonElement = document.querySelector(`.addon-circle[data-name="${addonName}"]`);
                    if (addonElement) {
                        itemAddons.push({
                            name: addonName,
                            price: parseFloat(addonElement.getAttribute('data-price'))
                        });
                    }
                });
                
                // If this is the currently selected item, also include visually selected add-ons
                if (orderState.selectedItem === name) {
                    const visuallySelected = [...document.querySelectorAll('.addon-circle.selected')].map(addon => ({
                        name: addon.getAttribute('data-name'),
                        price: parseFloat(addon.getAttribute('data-price'))
                    }));
                    
                    // Merge with stored add-ons (avoid duplicates)
                    visuallySelected.forEach(addon => {
                        if (!itemAddons.find(existing => existing.name === addon.name)) {
                            itemAddons.push(addon);
                        }
                    });
                }
                
                console.log(`getCurrentQuantityItems - Item: ${name}, Add-ons:`, itemAddons);
                
                // Calculate total including add-ons
                const addonTotal = itemAddons.reduce((sum, addon) => sum + addon.price, 0);
                const totalPrice = (price + addonTotal) * quantity;
                
                quantityItems.push({
                    name,
                    price,
                    quantity,
                    addons: itemAddons,
                    total: totalPrice,
                    source: 'quantity-buttons'
                });
            }
        });
        
        return quantityItems;
    }
});