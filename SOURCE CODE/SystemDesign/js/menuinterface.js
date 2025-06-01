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
    });

    // Initialize stored order items
    let storedOrderItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');

    // Replace the existing food item click handlers
    document.querySelectorAll('.food-item').forEach(item => {
        item.style.cursor = 'pointer';
        
        // Remove any existing click listeners first
        item.replaceWith(item.cloneNode(true));
    });

    // Re-select items after cloning and add new listeners
    document.querySelectorAll('.food-item').forEach(item => {
        item.style.cursor = 'pointer';
        
        item.addEventListener('click', function(e) {
            // Don't handle click if clicking quantity buttons
            if (e.target.closest('.quantity-scaler')) {
                return;
            }
            
            const foodName = this.querySelector('.food-name').textContent;
            const foodPrice = parseFloat(this.querySelector('.food-price').textContent.replace('₱', ''));
            const category = getDrinkCategory(this, foodName);
            
            console.log(`Clicked item: ${foodName}, Category: ${category}, Price: ${foodPrice}`);
            
            // Show add-ons modal only for hot and cold coffee
            if (category === 'hot-coffee' || category === 'cold-coffee') {
                showAddonsModal(foodName, foodPrice, this);
            } else {
                // For snacks and non-coffee drinks, add directly without add-ons
                addItemDirectly(foodName, foodPrice);
            }
        });
    });

    // Function to determine drink category
    function getDrinkCategory(item, foodName) {
        // Check if item is in coffee grid
        if (item.closest('.coffee-grid')) {
            // Determine if it's hot, cold, or non-coffee based on the section
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
            return 'snacks';
        }
    }

    // Function to show add-ons modal
    function showAddonsModal(itemName, itemPrice, itemElement) {
        console.log(`Showing addons modal for: ${itemName}`);
        const modal = document.getElementById('addonsModal');
        const itemNameSpan = modal.querySelector('.addon-item-name');
        
        if (!modal || !itemNameSpan) {
            console.error('Addons modal elements not found');
            return;
        }
        
        // Reset all checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Set item name in modal
        itemNameSpan.textContent = itemName;
        modal.style.display = 'flex';
        
        // Store current item data for later use
        modal.setAttribute('data-item-name', itemName);
        modal.setAttribute('data-item-price', itemPrice);
        
        console.log('Modal displayed successfully');
    }

    // Function to add item directly (for snacks)
    function addItemDirectly(itemName, itemPrice) {
        console.log(`Adding item directly: ${itemName}`);
        const orderItem = {
            name: itemName,
            price: itemPrice,
            quantity: 1,
            addons: [],
            total: itemPrice
        };
        
        storedOrderItems.push(orderItem);
        localStorage.setItem('storedOrderItems', JSON.stringify(storedOrderItems));
        showSuccessNotification(`Added ${itemName} to order`);
    }

    // Handle add-ons modal buttons
    const addonsModal = document.getElementById('addonsModal');
    
    if (addonsModal) {
        // Close modal button
        const closeBtn = addonsModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                addonsModal.style.display = 'none';
            });
        }
        
        // Cancel button
        const cancelBtn = addonsModal.querySelector('.cancel-modal-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                addonsModal.style.display = 'none';
            });
        }
        
        // Add to order button
        const addBtn = addonsModal.querySelector('.add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const itemName = addonsModal.getAttribute('data-item-name');
                const itemPrice = parseFloat(addonsModal.getAttribute('data-item-price'));
                
                // Get selected add-ons (no need to exclude "No Add-ons" since it's removed)
                const selectedAddons = [...addonsModal.querySelectorAll('input[type="checkbox"]:checked')].map(cb => ({
                    name: cb.getAttribute('data-name'),
                    price: parseFloat(cb.getAttribute('data-price'))
                }));
                
                // Calculate total price including add-ons
                const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
                const totalPrice = itemPrice + addonTotal;
                
                // Create order item
                const orderItem = {
                    name: itemName,
                    price: itemPrice,
                    quantity: 1,
                    addons: selectedAddons,
                    total: totalPrice
                };
                
                // Add to stored items
                storedOrderItems.push(orderItem);
                localStorage.setItem('storedOrderItems', JSON.stringify(storedOrderItems));
                
                // Close modal and show success
                addonsModal.style.display = 'none';
                
                // Create appropriate success message
                let successMessage;
                if (selectedAddons.length === 0) {
                    successMessage = `Added ${itemName} (no add-ons) to order`;
                } else {
                    const addonText = selectedAddons.length > 1 ? 's' : '';
                    successMessage = `Added ${itemName} with ${selectedAddons.length} add-on${addonText} to order`;
                }
                
                showSuccessNotification(successMessage);
            });
        }
        
        // Close modal when clicking outside
        addonsModal.addEventListener('click', (e) => {
            if (e.target === addonsModal) {
                addonsModal.style.display = 'none';
            }
        });
    }

    // Remove old conflicting handlers and update View Order functionality
    document.querySelector('.view-button').addEventListener('click', () => {
        console.log("View order button clicked");
        
        // Get stored items only (new modal-based flow)
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        console.log('Current stored items:', currentStoredItems);
        
        if (currentStoredItems.length === 0) {
            console.log("No items found, showing empty order modal");
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check order type
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Populate and show view order modal
        populateViewOrderModal(currentStoredItems);
        document.getElementById('viewOrderModal').style.display = 'flex';
    });

    // Function to populate view order modal with stored items
    function populateViewOrderModal(orderItems) {
        const orderTypeDisplay = document.querySelector('.order-type-display');
        const orderItemsContainer = document.querySelector('.order-items');
        const orderTotalContainer = document.querySelector('.order-total');
        
        // Clear previous content
        orderItemsContainer.innerHTML = '';
        
        // Display order type
        const activeOrderType = document.querySelector('.order-button.active');
        if (activeOrderType && orderTypeDisplay) {
            orderTypeDisplay.textContent = `Order Type: ${activeOrderType.textContent.trim()}`;
        }
        
        // Group items by name and add-ons
        const groupedItems = {};
        
        orderItems.forEach((item, originalIndex) => {
            // Create a unique key based on item name and add-ons
            const addonsKey = item.addons.map(addon => `${addon.name}:${addon.price}`).sort().join('|');
            const itemKey = `${item.name}::${addonsKey}`;
            
            if (groupedItems[itemKey]) {
                // Item with same name and add-ons exists, increase quantity
                groupedItems[itemKey].quantity += item.quantity;
                groupedItems[itemKey].originalIndexes.push(originalIndex);
            } else {
                // New item
                groupedItems[itemKey] = {
                    ...item,
                    originalIndexes: [originalIndex]
                };
            }
        });
        
        // Calculate accurate total and build items HTML
        let grandTotal = 0;
        let itemsHtml = '<ul class="order-item-list" style="list-style: none; padding: 0; margin: 0;">';
        
        Object.values(groupedItems).forEach((item, index) => {
            let addonHtml = '';
            
            if (item.addons && item.addons.length > 0) {
                addonHtml = '<div class="item-addons" style="margin-left: 15px; margin-top: 8px; background-color: #f9f9f9; padding: 8px; border-radius: 4px;">';
                item.addons.forEach(addon => {
                    addonHtml += `
                        <div class="addon-item" style="display: flex; justify-content: space-between; font-size: 0.9em; color: #666;">
                            <span>+ ${addon.name}</span>
                            <span>₱${addon.price.toFixed(2)}</span>
                        </div>
                    `;
                });
                addonHtml += '</div>';
            }
            
            // Calculate accurate item total: (base price + addon prices) * quantity
            const basePrice = parseFloat(item.price) || 0;
            const addonTotal = item.addons.reduce((sum, addon) => sum + (parseFloat(addon.price) || 0), 0);
            const itemUnitPrice = basePrice + addonTotal;
            const itemTotalPrice = itemUnitPrice * item.quantity;
            
            // Add to grand total
            grandTotal += itemTotalPrice;
            
            // Store original indexes as data attribute for removal
            const originalIndexesStr = item.originalIndexes.join(',');
            
            itemsHtml += `
                <li class="order-item" data-original-indexes="${originalIndexesStr}" data-item-key="${index}" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); pointer-events: none;">
                    <div class="item-main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="quantity-controls" style="display: flex; align-items: center; background: #f5f5f5; border-radius: 5px; padding: 2px; pointer-events: auto;">
                                <button class="qty-minus" data-item-key="${index}" style="background: #4A2C1B; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                                <input type="number" class="qty-input" data-item-key="${index}" value="${item.quantity}" min="1" style="width: 50px; text-align: center; border: none; background: transparent; font-weight: bold; color: #4A2C1B; margin: 0 5px; -webkit-appearance: none; -moz-appearance: textfield; appearance: none;">
                                <button class="qty-plus" data-item-key="${index}" style="background: #4A2C1B; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                            </div>
                            <span class="item-name" style="font-weight: bold; color: #4A2C1B;">${item.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; pointer-events: auto;">
                            <span class="item-price" style="color: #666;">₱${basePrice.toFixed(2)} each</span>
                            <button class="remove-item-btn" data-item-key="${index}" style="background: #f44336; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Remove item">×</button>
                        </div>
                    </div>
                    ${addonHtml}
                    <div class="item-total" style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc; font-weight: bold; color: #4A2C1B;">
                        <span>Subtotal:</span>
                        <span class="subtotal-amount">₱${itemTotalPrice.toFixed(2)}</span>
                    </div>
                </li>
            `;
        });
        
        itemsHtml += '</ul>';
        orderItemsContainer.innerHTML = itemsHtml;

        // Add CSS to hide spinner arrows for webkit browsers
        const style = document.createElement('style');
        style.textContent = `
            .qty-input::-webkit-outer-spin-button,
            .qty-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .qty-input[type=number] {
                -moz-appearance: textfield;
            }
        `;
        if (!document.head.querySelector('style[data-qty-arrows]')) {
            style.setAttribute('data-qty-arrows', 'true');
            document.head.appendChild(style);
        }
        
        if (orderTotalContainer) {
            orderTotalContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #4A2C1B; padding: 15px 0; border-top: 2px solid #4A2C1B;">
                    <span>Total Amount:</span>
                    <span class="total-amount">₱${grandTotal.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Add event listeners for quantity controls
        addQuantityControlListeners(groupedItems);
        
        // Add click handlers ONLY for remove buttons - Use event delegation to prevent conflicts
        const orderItemsList = orderItemsContainer.querySelector('.order-item-list');
        if (orderItemsList) {
            orderItemsList.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-item-btn')) {
                    e.stopPropagation();
                    const itemKey = parseInt(e.target.getAttribute('data-item-key'));
                    const groupedItemsArray = Object.values(groupedItems);
                    const originalIndexes = groupedItemsArray[itemKey].originalIndexes;
                    showRemoveConfirmationForGroup(originalIndexes);
                }
            });
        }
    }

    // Function to add quantity control listeners
    function addQuantityControlListeners(groupedItems) {
        const groupedItemsArray = Object.values(groupedItems);
        
        // Plus button listeners
        document.querySelectorAll('.qty-plus').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                const qtyInput = document.querySelector(`.qty-input[data-item-key="${itemKey}"]`);
                let currentQty = parseInt(qtyInput.value);
                currentQty++;
                qtyInput.value = currentQty;
                updateItemQuantity(itemKey, currentQty, groupedItemsArray);
            });
        });
        
        // Minus button listeners
        document.querySelectorAll('.qty-minus').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                const qtyInput = document.querySelector(`.qty-input[data-item-key="${itemKey}"]`);
                let currentQty = parseInt(qtyInput.value);
                if (currentQty > 1) {
                    currentQty--;
                    qtyInput.value = currentQty;
                    updateItemQuantity(itemKey, currentQty, groupedItemsArray);
                }
            });
        });
        
        // Input field listeners
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                let newQty = parseInt(this.value);
                if (isNaN(newQty) || newQty < 1) {
                    newQty = 1;
                    this.value = 1;
                }
                updateItemQuantity(itemKey, newQty, groupedItemsArray);
            });
            
            // Prevent form submission on Enter key
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        });
    }

    // Function to update item quantity
    function updateItemQuantity(itemKey, newQuantity, groupedItemsArray) {
        const item = groupedItemsArray[itemKey];
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        // Calculate the difference in quantity
        const originalItemCount = item.originalIndexes.length;
        const quantityDiff = newQuantity - originalItemCount;
        
        if (quantityDiff > 0) {
            // Add more items
            for (let i = 0; i < quantityDiff; i++) {
                const newItem = {
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    addons: [...item.addons],
                    total: item.price + item.addons.reduce((sum, addon) => sum + addon.price, 0)
                };
                currentStoredItems.push(newItem);
            }
        } else if (quantityDiff < 0) {
            // Remove items (from the end)
            const itemsToRemove = Math.abs(quantityDiff);
            const indexesToRemove = item.originalIndexes.slice(-itemsToRemove).sort((a, b) => b - a);
            
            indexesToRemove.forEach(index => {
                if (index < currentStoredItems.length) {
                    currentStoredItems.splice(index, 1);
                }
            });
        }
        
        // Update localStorage
        localStorage.setItem('storedOrderItems', JSON.stringify(currentStoredItems));
        storedOrderItems = currentStoredItems;
        
        // Update the display
        updateItemDisplay(itemKey, item, newQuantity);
        updateTotalDisplay();
    }

    // Function to update item display
    function updateItemDisplay(itemKey, item, newQuantity) {
        const orderItem = document.querySelector(`.order-item[data-item-key="${itemKey}"]`);
        if (orderItem) {
            // Calculate accurate subtotal: (base price + addon prices) * quantity
            const basePrice = parseFloat(item.price) || 0;
            const addonTotal = item.addons.reduce((sum, addon) => sum + (parseFloat(addon.price) || 0), 0);
            const unitPrice = basePrice + addonTotal;
            const newSubtotal = unitPrice * newQuantity;
            
            const subtotalElement = orderItem.querySelector('.subtotal-amount');
            if (subtotalElement) {
                subtotalElement.textContent = `₱${newSubtotal.toFixed(2)}`;
            }
        }
    }

    // Function to update total display
    function updateTotalDisplay() {
        // Recalculate total from all visible items in the modal
        let grandTotal = 0;
        
        // Get all visible order items and calculate their totals
        document.querySelectorAll('.order-item').forEach(orderItem => {
            const subtotalElement = orderItem.querySelector('.subtotal-amount');
            if (subtotalElement) {
                const subtotalText = subtotalElement.textContent.replace('₱', '').replace(',', '');
                const subtotal = parseFloat(subtotalText) || 0;
                grandTotal += subtotal;
            }
        });
        
        const totalElement = document.querySelector('.total-amount');
        if (totalElement) {
            totalElement.textContent = `₱${grandTotal.toFixed(2)}`;
        }
    }

    // Modal control buttons - Fix the order confirmation flow
    document.querySelector('.confirm-modal-btn').addEventListener('click', async () => {
        console.log("Confirm order button clicked");
        
        // Get the current stored items
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        if (currentStoredItems.length === 0) {
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
            const orderData = await submitOrderToDatabase(currentStoredItems, orderType.textContent.trim());
            
            if (orderData.success) {
                // Clear stored items after successful submission
                localStorage.removeItem('storedOrderItems');
                storedOrderItems = [];
                
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

    // Add missing functions for handling modals
    function updateOrderSummary() {
        // This function should return the current stored items
        return JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
    }

    function getCurrentQuantityItems() {
        // This function gets items from the quantity-based interface (old system)
        // Since we're using the new modal-based system, this should return empty array
        return [];
    }

    function populateOrderModalWithAllItems(orderItems) {
        // Use the existing populateViewOrderModal function
        populateViewOrderModal(orderItems);
    }

    // Add modal handlers for closing modals
    document.addEventListener('click', function(e) {
        // Handle order type modal option buttons
        if (e.target.classList.contains('option-btn')) {
            const orderType = e.target.getAttribute('data-type');
            
            // Set the order type
            document.querySelectorAll('.order-button').forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#e0e0e0';
            });
            
            document.querySelectorAll('.order-button').forEach(btn => {
                if (btn.textContent.trim() === orderType) {
                    btn.classList.add('active');
                    btn.style.backgroundColor = '#ffffff';
                }
            });
            
            // Close the modal
            document.getElementById('orderTypeModal').style.display = 'none';
            
            // Show view order modal if we have items
            const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
            if (currentStoredItems.length > 0) {
                populateViewOrderModal(currentStoredItems);
                document.getElementById('viewOrderModal').style.display = 'flex';
            }
        }
        
        // Handle empty order modal close button
        if (e.target.classList.contains('notification-ok-btn')) {
            const modal = e.target.closest('.notification-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle all X close buttons (close-modal and close-notification-modal)
        if (e.target.classList.contains('close-modal') || e.target.classList.contains('close-notification-modal')) {
            // Find the closest modal container
            let modal = e.target.closest('.notification-modal') || 
                       e.target.closest('.view-order-modal') || 
                       e.target.closest('.addons-modal') || 
                       e.target.closest('.thank-you-modal');
            
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle all cancel buttons in modals
        if (e.target.classList.contains('cancel-modal-btn')) {
            // Find the closest modal container
            let modal = e.target.closest('.notification-modal') || 
                       e.target.closest('.view-order-modal') || 
                       e.target.closest('.addons-modal') || 
                       e.target.closest('.thank-you-modal');
            
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle modal overlay clicks (clicking outside modal content)
        if (e.target.classList.contains('notification-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('view-order-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('addons-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('thank-you-modal')) {
            e.target.style.display = 'none';
        }
    });

    // Remove the duplicate view order button handler that was causing conflicts
    // (The one that starts with "document.querySelector('.view-button').addEventListener('click', () => {")
    // Keep only the first one we defined above

    // Function to show remove confirmation for grouped items
    function showRemoveConfirmationForGroup(originalIndexes) {
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmationMessage = document.getElementById('confirmationMessage');
        const currentItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        if (originalIndexes.length > 0 && currentItems[originalIndexes[0]]) {
            const itemName = currentItems[originalIndexes[0]].name;
            const quantity = originalIndexes.length;
            
            if (quantity === 1) {
                confirmationMessage.textContent = `Are you sure you want to remove "${itemName}" from your order?`;
            } else {
                confirmationMessage.textContent = `Are you sure you want to remove all ${quantity} "${itemName}" items from your order?`;
            }
            
            confirmationModal.style.display = 'flex';
            
            document.getElementById('confirmYes').onclick = function() {
                removeGroupedItemsFromOrder(originalIndexes);
                confirmationModal.style.display = 'none';
            };
            
            document.getElementById('confirmCancel').onclick = function() {
                confirmationModal.style.display = 'none';
            };
        }
    }

    // Function to remove grouped items from order
    function removeGroupedItemsFromOrder(originalIndexes) {
        let currentItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        // Sort indexes in descending order to remove from the end first
        originalIndexes.sort((a, b) => b - a);
        
        // Remove items by their original indexes
        originalIndexes.forEach(index => {
            if (index < currentItems.length) {
                currentItems.splice(index, 1);
            }
        });
        
        localStorage.setItem('storedOrderItems', JSON.stringify(currentItems));
        storedOrderItems = currentItems;
        
        if (currentItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
        } else {
            populateViewOrderModal(currentItems);
        }
    }

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
        
        // Clear all stored order data completely
        localStorage.removeItem('storedOrderItems');
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        localStorage.removeItem('pendingOrderType');
        localStorage.removeItem('lastOrderNumber');
        
        // Reset the storedOrderItems variable
        storedOrderItems = [];
        
        // Clear all visual selections and reset quantities
        document.querySelectorAll('.selected').forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('in-order');
        });
        
        // Reset all quantity values to 0
        document.querySelectorAll('.quantity-value').forEach(qtyElement => {
            qtyElement.textContent = '0';
        });
        
        // Disable all minus buttons
        document.querySelectorAll('.minus').forEach(minusBtn => {
            minusBtn.disabled = true;
        });
        
        // Reset order type buttons
        document.querySelectorAll('.order-button').forEach(btn => {
            btn.classList.remove('active');
            btn.style.backgroundColor = '#e0e0e0';
        });
        
        console.log("All order data cleared successfully");
        
        // Navigate to welcome interface
        window.location.href = 'welcomeinterface.html';
    });

    // Initialize quantities and handle quantity changes
    document.querySelectorAll('.food-item').forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        if (quantityValue) quantityValue.textContent = '0';
        if (minusBtn) minusBtn.disabled = true;
    });

    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        const minusBtn = scaler.querySelector('.minus');
        const plusBtn = scaler.querySelector('.plus');
        const valueSpan = scaler.querySelector('.quantity-value');
        const foodItem = scaler.closest('.food-item');

        if (minusBtn && plusBtn && valueSpan && foodItem) {
            minusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let value = parseInt(valueSpan.textContent);
                if (value > 0) {
                    value--;
                    valueSpan.textContent = value;
                    minusBtn.disabled = value === 0;
                    
                    if (value === 0) {
                        foodItem.classList.remove('selected');
                        foodItem.classList.remove('in-order');
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
                foodItem.classList.add('in-order');
                updateOrderSummary();
            });
        }
    });

    // Function to show success notification
    function showSuccessNotification(message) {
        let notification = document.querySelector('.success-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 16px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                display: none;
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
});