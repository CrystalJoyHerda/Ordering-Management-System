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
            
            // Deselect any currently selected items
            document.querySelectorAll('.food-item.selected').forEach(item => {
                item.classList.remove('selected');
            });

            // Show appropriate grid and toggle add-ons section
            if (button.textContent.toLowerCase() === 'coffee') {
                coffeeGrid.classList.add('active');
                snacksGrid.classList.remove('active');
                rightSection.style.display = 'block'; // Show add-ons for coffee category
                
                // Update selected item display
                const selectedItemName = document.querySelector('.selected-item-name');
                selectedItemName.textContent = 'Select an item first';
                selectedItemName.classList.add('none-selected');
            } else {
                snacksGrid.classList.add('active');
                coffeeGrid.classList.remove('active');
                rightSection.style.display = 'none'; // Hide add-ons for snacks category
            }
        });
    });

    // Food item selection and quantity scaler handling
    const foodItems = document.querySelectorAll('.food-item');
    foodItems.forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
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

            // Deselect other items and hide their quantity scalers
            foodItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('selected');
                }
            });

            // Toggle selection of current item
            const wasSelected = item.classList.contains('selected');
            item.classList.toggle('selected');
            
            // Check if this is a second click on an item that's already in the order
            const quantity = parseInt(quantityValue.textContent);
            const isInOrder = item.classList.contains('in-order');
            
            if (wasSelected && isInOrder) {
                // User is clicking an item that's already in the order - ask if they want to remove it
                const foodName = item.querySelector('.food-name').textContent;
                
                showConfirmationModal(foodName, () => {
                    // Reset quantity to 0
                    quantityValue.textContent = '0';
                    minusBtn.disabled = true;
                    item.classList.remove('in-order');                                    // Clean up any associated add-ons
                                    document.querySelectorAll('.addon-circle').forEach(addon => {
                                        if (addon.getAttribute('data-for-item') === foodName) {
                                            addon.classList.remove('selected');
                                            // Important: Remove the association completely
                                            addon.removeAttribute('data-for-item');
                                        }
                                    });
                    
                    updateOrderSummary();
                });
                
                return;
            }
              // Update the selected item display in the add-ons section
            const selectedItemName = document.querySelector('.selected-item-name');
            if (item.classList.contains('selected')) {
                const foodName = item.querySelector('.food-name').textContent;
                const rightSection = document.querySelector('.right-section');
                
                // Check if the selected food item is in the coffee grid
                const isCoffeeItem = item.closest('.coffee-grid') !== null;
                
                if (isCoffeeItem) {
                    // Show add-ons section for coffee items
                    rightSection.style.display = 'block';
                    selectedItemName.textContent = foodName;
                    selectedItemName.classList.remove('none-selected');
                    
                    // Highlight any add-ons already associated with this item
                    document.querySelectorAll('.addon-circle').forEach(addon => {
                        // Only update visual selection, don't remove data-for-item attributes
                        if (addon.getAttribute('data-for-item') === foodName) {
                            addon.classList.add('selected');
                        } else {
                            // Just visually deselect add-ons for other items
                            addon.classList.remove('selected');
                        }
                    });
                } else {
                    // Hide add-ons section for non-coffee items
                    rightSection.style.display = 'none';
                }
                
                // If item was just selected and has 0 quantity, set to 1
                if (quantityValue.textContent === '0') {
                    quantityValue.textContent = '1';
                    minusBtn.disabled = false;
                    item.classList.add('in-order');
                    updateOrderSummary();
                }            } else {
                selectedItemName.textContent = 'Select an item first';
                selectedItemName.classList.add('none-selected');
                
                // Check if we're in the coffee category
                const isCoffeeCategory = coffeeGrid.classList.contains('active');
                if (isCoffeeCategory) {
                    // Make sure add-ons section is visible if we're in coffee category
                    rightSection.style.display = 'block';
                }
                
                // Visually deselect all add-ons, but keep their associations
                document.querySelectorAll('.addon-circle').forEach(addon => {
                    addon.classList.remove('selected');
                });
            }
        });
    });

    // Prevent quantity buttons from closing the scaler
    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        scaler.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });    // Add-on selection - improved to ensure proper item association and only for coffee items
    const addons = document.querySelectorAll('.addon-circle');
    addons.forEach(addon => {
        addon.addEventListener('click', () => {
            // Only allow add-ons to be selected if there's a food item selected
            const selectedFoodItem = document.querySelector('.food-item.selected');
            if (!selectedFoodItem) {
                // Make the "Select an item first" text flash to draw attention
                const selectedItemName = document.querySelector('.selected-item-name');
                selectedItemName.style.animation = 'none';
                setTimeout(() => {
                    selectedItemName.style.animation = 'flash 0.5s 2';
                }, 10);
                return;
            }
            
            // Check if the selected food item is in the coffee grid (add-ons only for coffee)
            const isCoffeeItem = selectedFoodItem.closest('.coffee-grid') !== null;
            if (!isCoffeeItem) {
                // For non-coffee items, don't allow add-ons
                const selectedItemName = document.querySelector('.selected-item-name');
                selectedItemName.style.animation = 'none';
                setTimeout(() => {
                    selectedItemName.style.animation = 'flash 0.5s 2';
                }, 10);
                return;
            }
            
            // Get the currently selected food item name
            const foodName = selectedFoodItem.querySelector('.food-name').textContent;
            
            // Toggle selection for this specific food item
            const isCurrentlySelected = addon.classList.contains('selected');
            
            if (isCurrentlySelected) {
                // If it was selected and associated with this food item, remove the association
                if (addon.getAttribute('data-for-item') === foodName) {
                    console.log(`Removed add-on: ${addon.getAttribute('data-name')} from item: ${foodName}`);
                    addon.removeAttribute('data-for-item');
                    addon.classList.remove('selected');
                }
            } else {
                // If it wasn't selected, associate it with this food item
                addon.classList.add('selected');
                addon.setAttribute('data-for-item', foodName);
                console.log(`Associated add-on: ${addon.getAttribute('data-name')} with item: ${foodName}`);
            }
            
            // Update the order summary to reflect the changes
            updateOrderSummary();
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
            // Calculate item totals
            const basePrice = item.price * item.quantity;
            let addonTotal = 0;
            
            // Calculate addon costs
            if (item.addons && item.addons.length > 0) {
                item.addons.forEach(addon => {
                    addonTotal += addon.price * item.quantity;
                });
            }
            
            const itemTotal = basePrice + addonTotal;
            total += itemTotal;
            
            // Create addon text if there are addons
            let addonText = '';
            if (item.addons && item.addons.length > 0) {
                addonText = `<div class="item-addons">`;
                item.addons.forEach(addon => {
                    addonText += `<div class="addon-item">${addon.name} (₱${addon.price.toFixed(2)} × ${item.quantity})</div>`;
                });
                addonText += `</div>`;
            }
            
            // Add the item to the HTML
            itemsHtml += `
                <li class="order-item" data-name="${item.name}">
                    <div class="item-main">
                        <span class="item-quantity">${item.quantity}x</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">₱${basePrice.toFixed(2)}</span>
                    </div>
                    ${addonText}
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
        console.log("View order button clicked");
        
        // Get current order items
        const orderItems = updateOrderSummary();
        
        // Check if there are any items in the order
        if (orderItems.length === 0) {
            // Show empty order modal
            console.log("No items in order, showing empty order modal");
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            // Show order type selection modal instead of alert
            console.log("No order type selected, showing order type modal");
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Only if we have items and order type is selected, show the order modal
        console.log("Order has items and type is selected, showing view order modal");
        populateOrderModal();
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
    
    // Function to remove item from order
    function removeItemFromOrder(itemName) {
        // Find the item in the menu and reset its quantity
        document.querySelectorAll('.food-item').forEach(item => {
            const name = item.querySelector('.food-name').textContent;
            if (name === itemName) {
                item.querySelector('.quantity-value').textContent = '0';
                item.querySelector('.quantity-btn.minus').disabled = true;
                item.classList.remove('in-order');
                
                // Clean up any associated add-ons
                document.querySelectorAll('.addon-circle').forEach(addon => {
                    if (addon.getAttribute('data-for-item') === itemName) {
                        addon.classList.remove('selected');
                        addon.removeAttribute('data-for-item');
                    }
                });
            }
        });
        
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
            loadingSpinner.innerHTML = '<p class="success-message" style="font-size: 18px; color: #388e3c; font-weight: bold;">✓ Receipt printed successfully!</p><p>Your queue number is <strong>' + document.getElementById('orderNumber').textContent + '</strong></p><p>Please wait for your order to be called.</p>';
            
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
            };
              console.log('Submitting order to database:', orderData);
            // Submit to backend API (XAMPP htdocs path)
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
});
