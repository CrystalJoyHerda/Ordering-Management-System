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
    });    // Category switching functionality
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
    });    // Food item selection and quantity scaler handling
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
    `;
    document.head.appendChild(style);

    // Close quantity scalers when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.food-item')) {
            document.querySelectorAll('.quantity-scaler').forEach(scaler => {
                scaler.classList.remove('active');
            });
        }
    });
        // Order summary update
    // Update the updateOrderSummary function to also update visual indicators
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
        
        // Log all items with their add-ons
        selectedItems.forEach(item => {
            console.log(`Item: ${item.name}, Add-ons count: ${item.addons.length}`);
            item.addons.forEach(addon => {
                console.log(`  - ${addon.name} (₱${addon.price})`);
            });
        });
        
        // Save to localStorage for access across pages
        localStorage.setItem('orderItems', JSON.stringify(selectedItems));
        return selectedItems;
    }

    // View order button - Show modal instead of navigating
    document.querySelector('.view-button').addEventListener('click', () => {
        // Get current order items
        const orderItems = updateOrderSummary();
        
        // Check if there are any items in the order
        if (orderItems.length === 0) {
            // Show empty order modal
            document.getElementById('emptyOrderModal').classList.add('active');
            return;
        }
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            // Show order type selection modal instead of alert
            document.getElementById('orderTypeModal').classList.add('active');
            return;
        }
        
        // Show the order modal
        populateOrderModal();
        document.getElementById('viewOrderModal').classList.add('active');
    });

    // Handle order type modal close button
    document.querySelector('#orderTypeModal .close-notification-modal').addEventListener('click', () => {
        document.getElementById('orderTypeModal').classList.remove('active');
    });

    // Handle order type selection from modal
    document.querySelectorAll('#orderTypeModal .option-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Get the order type from data attribute
            const orderType = button.getAttribute('data-type');
            
            // Find and activate the corresponding order button in the header
            document.querySelectorAll('.order-button').forEach(btn => {
                if (btn.textContent === orderType) {
                    // Simulate a click on the correct order button
                    btn.click();
                }
            });
            
            // Close the order type modal
            document.getElementById('orderTypeModal').classList.remove('active');
            
            // Show the view order modal
            populateOrderModal();
            document.getElementById('viewOrderModal').classList.add('active');
        });
    });

    document.querySelector('.notification-ok-btn').addEventListener('click', () => {
        document.getElementById('emptyOrderModal').classList.remove('active');
    });

    // Function to populate the order modal - fixed to properly show all add-ons
    function populateOrderModal() {
        // Get all add-ons with associations before updating summary
        const addonsBefore = Array.from(document.querySelectorAll('.addon-circle[data-for-item]')).map(addon => ({
            name: addon.getAttribute('data-name'),
            forItem: addon.getAttribute('data-for-item'),
            selected: addon.classList.contains('selected')
        }));
        console.log('Add-ons before summary update:', addonsBefore);
        
        // Get the order items - make sure to update the summary first to get the latest data
        const orderItems = updateOrderSummary();
        
        // Debug the items and their add-ons to verify associations
        console.log('Order items for modal:', JSON.stringify(orderItems, null, 2));
        
        // Get the modal body elements
        const orderTypeDisplay = document.querySelector('.order-type-display');
        const orderItemsContainer = document.querySelector('.order-items');
        const orderTotalContainer = document.querySelector('.order-total');
        
        // Clear previous content
        orderItemsContainer.innerHTML = '';
        
        // Display the selected order type
        const activeOrderType = document.querySelector('.order-button.active');
        if (activeOrderType) {
            orderTypeDisplay.textContent = `Order Type: ${activeOrderType.textContent}`;
        } else {
            orderTypeDisplay.textContent = 'Please select an order type';
        }
        
        // Add items to the container
        let total = 0;
        
        orderItems.forEach(item => {
            // Double check that quantity is > 0
            if (item.quantity > 0) {
                // Calculate item totals
                const basePrice = item.price * item.quantity;
                let addonTotal = 0;
                
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.setAttribute('data-item-name', item.name);                // Format add-ons as a string if they exist
                const addonNames = [];
                
                if (item.addons && item.addons.length > 0) {
                    item.addons.forEach(addon => {
                        const addonCost = addon.price * item.quantity;
                        addonTotal += addonCost;
                        addonNames.push(addon.name);
                        
                        console.log(`Adding ${addon.name} to ${item.name} display`);
                    });
                }
                
                // Add debugging message about add-ons
                console.log(`Displaying ${item.name}: Has ${item.addons ? item.addons.length : 0} add-ons`);
                
                // Start with the main item, including add-ons inline if they exist
                let formattedAddons = '';
                if (addonNames.length > 0) {
                    if (addonNames.length > 2) {
                        // If there are more than 2 add-ons, display count instead
                        formattedAddons = `<span class="inline-addons">(+ ${addonNames.length} add-ons)</span>`;
                    } else {
                        formattedAddons = `<span class="inline-addons">(+ ${addonNames.join(', ')})</span>`;
                    }
                }
                
                let itemHTML = `
                    <div class="item-main">
                        <div>
                            ${item.name} x ${item.quantity}
                            ${formattedAddons}
                        </div>
                        <div>₱${basePrice.toFixed(2)}</div>
                    </div>
                `;
                  // Add item total including add-ons
                const itemTotal = basePrice + addonTotal;
                
                // Show add-on costs separately if there are any
                if (addonTotal > 0) {
                    itemHTML += `
                        <div class="addon-cost-summary">
                            <div>Add-ons:</div>
                            <div>₱${addonTotal.toFixed(2)}</div>
                        </div>
                    `;
                }
                
                itemHTML += `
                    <div class="item-total">
                        <div>Item Total:</div>
                        <div>₱${itemTotal.toFixed(2)}</div>
                    </div>
                `;
                
                orderItem.innerHTML = itemHTML;
                
                // Add click event to remove the item
                orderItem.addEventListener('click', function() {
                    const itemName = this.getAttribute('data-item-name');
                    
                    showConfirmationModal(itemName, () => {
                        // Visual feedback - add removing animation
                        this.classList.add('removing');
                        
                        // After a short delay, remove the item from the DOM and data
                        setTimeout(() => {
                            // Find the food item in the menu and reset it
                            document.querySelectorAll('.food-item').forEach(foodItem => {
                                const foodName = foodItem.querySelector('.food-name').textContent;
                                if (foodName === itemName) {
                                    // Reset quantity to 0
                                    const quantityValue = foodItem.querySelector('.quantity-value');
                                    const minusBtn = foodItem.querySelector('.minus');
                                    
                                    quantityValue.textContent = '0';
                                    minusBtn.disabled = true;
                                    foodItem.classList.remove('selected', 'in-order');
                                    
                                    // Clean up associated add-ons
                                    document.querySelectorAll('.addon-circle').forEach(addon => {
                                        if (addon.getAttribute('data-for-item') === foodName) {
                                            addon.classList.remove('selected');
                                            addon.removeAttribute('data-for-item');
                                        }
                                    });
                                }
                            });
                            
                            // Update the order summary
                            const updatedOrder = updateOrderSummary();
                            
                            // If no items left, close modal and show empty order modal
                            if (updatedOrder.length === 0) {
                                document.getElementById('viewOrderModal').classList.remove('active');
                                document.getElementById('emptyOrderModal').classList.add('active');
                            } else {
                                // Otherwise repopulate the modal
                                populateOrderModal();
                            }
                        }, 300); // Short delay for the animation to play
                    });
                });
                
                orderItemsContainer.appendChild(orderItem);
                total += itemTotal;
            }
        });
        
        // Display total
        orderTotalContainer.innerHTML = `Total: ₱${total.toFixed(2)}`;
    }

    // Confirm button in modal
    document.querySelector('.confirm-modal-btn').addEventListener('click', () => {
        // Get the order items
        const orderItems = updateOrderSummary();
        
        if (orderItems.length === 0) {
            document.getElementById('viewOrderModal').classList.remove('active');
            document.getElementById('emptyOrderModal').classList.add('active');
            return;
        }
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('viewOrderModal').classList.remove('active');
            document.getElementById('orderTypeModal').classList.add('active');
            return;
        }
        
        // Save order type to localStorage
        localStorage.setItem('orderType', orderType.textContent);
        
        // Generate random order number and save to localStorage
        const orderNumber = Math.floor(Math.random() * 999) + 1;
        const formattedOrderNumber = orderNumber.toString().padStart(3, '0');
        localStorage.setItem('lastOrderNumber', formattedOrderNumber);
        
        // Update order number in Thank You Modal
        document.getElementById('orderNumber').textContent = formattedOrderNumber;
        
        // Close the view order modal and show the thank you modal
        document.getElementById('viewOrderModal').classList.remove('active');
        document.getElementById('thankYouModal').classList.add('active');
    });

    // Close modal when clicking on X
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('viewOrderModal').classList.remove('active');
    });

    // Close modal when clicking on Cancel button
    document.querySelector('.cancel-modal-btn').addEventListener('click', () => {
        document.getElementById('viewOrderModal').classList.remove('active');
    });

    // Handle Thank You Modal close button
    document.querySelector('.close-thank-you-btn').addEventListener('click', function() {
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
            document.querySelector('.close-thank-you-btn').textContent = 'Go to Home';
            
            // Still add a fallback automatic redirect after 8 seconds in case user doesn't click
            setTimeout(() => {
                window.location.href = 'welcomeinterface.html';
            }, 8000);
        }, 3000);
    });

    // Cancel order button - Navigate to welcome interface
    document.querySelector('.cancel-button').addEventListener('click', () => {
        // Clear selections
        document.querySelectorAll('.selected').forEach(item => {
            item.classList.remove('selected');
        });
        // Navigate to welcome interface
        window.location.href = 'welcomeinterface.html';
    });

    // Initialize all quantities to 0 and disable minus buttons
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

    // Handle quantity changes
    document.querySelectorAll('.food-item').forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        const plusBtn = item.querySelector('.plus');
        
        // Set initial quantity to 0
        quantityValue.textContent = '0';
        minusBtn.disabled = true;

        // Plus button click handler
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(quantityValue.textContent);
            value++;
            quantityValue.textContent = value;
            minusBtn.disabled = false;
            item.classList.add('selected');
            item.classList.add('in-order');
            updateOrderSummary();
        });

        // Minus button click handler
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let value = parseInt(quantityValue.textContent);
            if (value > 0) {
                value--;
                quantityValue.textContent = value;
                minusBtn.disabled = value === 0;
                
                if (value === 0) {
                    item.classList.remove('selected');
                    item.classList.remove('in-order');
                }
                
                updateOrderSummary();
            }
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
        
        // Prevent highlighting when clicking and dragging
        document.addEventListener('mousedown', (e) => {
            // Don't prevent default on form controls
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('editable-field')) {
                // Still allow primary button clicks for functionality
                if (e.button !== 0 || e.ctrlKey) {
                    e.preventDefault();
                }
                
                // Clear any existing text selection
                window.getSelection().removeAllRanges();
            }
        });
        
        // Process all specific UI elements
        allElements.forEach(element => {
            // Skip form elements
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.classList.contains('editable-field')) {
                return;
            }
            
            // Set draggable attribute to false
            element.setAttribute('draggable', 'false');
            
            // Prevent context menu (right click) on non-form elements
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
            
            // Prevent touch selection
            element.addEventListener('touchstart', (e) => {
                // Allow touch for buttons and interactive elements
                if (!e.target.closest('.quantity-btn, .cancel-button, .view-button, .cancel-modal-btn, .confirm-modal-btn')) {
                    // Prevent default touch behavior that might lead to text selection
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        // Don't call preventDefault here to maintain scrolling functionality
                        e.stopPropagation();
                    }
                }
            }, { passive: true });
        });
        
        // Make sure all images are not draggable
        document.querySelectorAll('img').forEach(img => {
            img.setAttribute('draggable', 'false');
            img.style.pointerEvents = 'none'; // Prevent image dragging
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
    
    // Reapply when modals are opened
    ['#viewOrderModal', '#confirmationModal', '#notificationModal', '#thankYouModal'].forEach(selector => {
        const modal = document.querySelector(selector);
        if (modal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class' && modal.classList.contains('active')) {
                        setTimeout(preventDragging, 100);
                    }
                });
            });
            observer.observe(modal, { attributes: true });
        }
    });

    // Add confirmation modal functionality
    let currentItemToRemove = null;
    let removeCallback = null;

    function showConfirmationModal(itemName, callback) {
        document.getElementById('confirmationMessage').textContent = `Are you sure you want to remove "${itemName}" from your order?`;
        document.getElementById('confirmationModal').classList.add('active');
        currentItemToRemove = itemName;
        removeCallback = callback;
    }

    document.getElementById('confirmCancel').addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        currentItemToRemove = null;
        removeCallback = null;
    });

    document.getElementById('confirmYes').addEventListener('click', () => {
        document.getElementById('confirmationModal').classList.remove('active');
        if (removeCallback) {
            removeCallback();
        }
        currentItemToRemove = null;
        removeCallback = null;
    });

    function handleAddItem() {
        const selectedItems = [];
        document.querySelectorAll('.food-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            if (quantity > 0) {
                const name = item.querySelector('.food-name').textContent;
                const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
                const addons = [];

                // Get any add-ons associated with this item
                document.querySelectorAll(`.addon-circle[data-for-item="${name}"]`).forEach(addon => {
                    addons.push({
                        name: addon.getAttribute('data-name'),
                        price: parseFloat(addon.getAttribute('data-price'))
                    });
                });

                selectedItems.push({
                    name,
                    price,
                    quantity,
                    addons
                });
            }
        });

        if (selectedItems.length > 0) {
            // Store selected items in localStorage
            localStorage.setItem('newAddedItems', JSON.stringify(selectedItems));
            // Redirect to cashiering page
            window.location.href = 'cashiering.html';
        } else {
            // Show error modal if no items selected
            document.getElementById('errorModal').classList.add('active');
        }
    }

    function closeErrorModal() {
        document.getElementById('errorModal').classList.remove('active');
    }

    function addItemToCashiering() {
        // Get all selected items with quantities
        const selectedItems = [];
        document.querySelectorAll('.food-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            if (quantity > 0) {
                const name = item.querySelector('.food-name').textContent;
                const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
                const addons = [];

                // Get add-ons for this item
                document.querySelectorAll(`.addon-circle[data-for-item="${name}"]`).forEach(addon => {
                    addons.push({
                        name: addon.getAttribute('data-name'),
                        price: parseFloat(addon.getAttribute('data-price'))
                    });
                });

                selectedItems.push({
                    name,
                    price,
                    quantity,
                    addons,
                    total: (price * quantity) + (addons.reduce((sum, addon) => sum + (addon.price * quantity), 0))
                });
            }
        });

        if (selectedItems.length === 0) {
            // Show error modal if no items selected
            document.getElementById('errorModal').classList.add('active');
            return;
        }

        // Store items in localStorage
        localStorage.setItem('newAddedItems', JSON.stringify(selectedItems));

        // Redirect to cashiering page
        window.location.href = 'cashiering.html';
    }

    // Close error modal function
    function closeErrorModal() {
        document.getElementById('errorModal').classList.remove('active');
    }

    // Remove all existing addItemToCashiering functions and replace with this new version
    window.addItemToCashiering = function() {
        const selectedItems = [];
        let hasItems = false;

        // Collect all items with quantity > 0
        document.querySelectorAll('.food-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.quantity-value').textContent);
            if (quantity > 0) {
                hasItems = true;
                const name = item.querySelector('.food-name').textContent;
                const price = parseFloat(item.querySelector('.food-price').textContent.replace('₱', ''));
                const addons = [];

                // Get add-ons for this item
                document.querySelectorAll(`.addon-circle[data-for-item="${name}"]`).forEach(addon => {
                    addons.push({
                        name: addon.getAttribute('data-name'),
                        price: parseFloat(addon.getAttribute('data-price'))
                    });
                });

                const itemTotal = (price * quantity) + 
                                (addons.reduce((sum, addon) => sum + (addon.price * quantity), 0));

                selectedItems.push({
                    name,
                    price,
                    quantity,
                    addons,
                    total: itemTotal
                });
            }
        });

        if (!hasItems) {
            // Show error modal if no items selected
            document.getElementById('errorModal').classList.add('active');
            return;
        }

        // Store items in localStorage
        localStorage.setItem('newAddedItems', JSON.stringify(selectedItems));

        // Redirect to cashiering page
        window.location.href = 'cashiering.html';
    };

    // Add error modal close function
    window.closeErrorModal = function() {
        document.getElementById('errorModal').classList.remove('active');
    };
});
