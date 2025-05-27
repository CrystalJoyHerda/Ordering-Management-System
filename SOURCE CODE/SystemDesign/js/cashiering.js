// Test to verify JS file is loading
console.log('cashiering.js file loaded successfully');

// Global variable to store current order ID for database synchronization
let currentOrderId = null;

// Helper function to sync order changes to database
async function syncOrderToDatabase() {
    if (!currentOrderId) {
        console.log('⚠️ No order ID available for sync');
        return false;
    }
    
    console.log('🔄 Syncing order changes to database...');
    
    try {
        // Collect current order items from the interface
        const orderItems = [];
        const quantities = document.getElementById('items-container').children;
        const names = document.getElementById('names-container').children;
        const addons = document.getElementById('addons-container').children;
        
        for (let i = 0; i < quantities.length; i++) {
            const qtyText = quantities[i].childNodes[0].textContent.trim();
            const qty = parseInt(qtyText);
            const name = names[i].textContent.trim();
            const addonText = addons[i].textContent.trim();
            
            // Step 1: Get original price
            const originalPrice = getBasePrice(name);
            
            // Step 2: Calculate total add-ons price
            let totalAddOnsPrice = 0;
            let addonsList = [];
            
            if (addonText !== '-' && addonText) {
                addonsList = addonText.split(', ').map(a => a.trim());
                totalAddOnsPrice = addonsList.reduce((sum, addonName) => {
                    return sum + getAddonPrice(addonName);
                }, 0);
            }
            
            // Step 3: Calculate unit price = original + total add-ons
            const unitPrice = originalPrice + totalAddOnsPrice;
            
            orderItems.push({
                product_name: name,
                quantity: qty,
                unit_price: unitPrice,
                total_price: unitPrice * qty,
                addons: addonsList
            });
        }
        
        // Calculate new total using the latest unit prices
        const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);
        
        // Get order type
        const selectedOrderType = document.querySelector('.type-button.active');
        const orderType = selectedOrderType ? selectedOrderType.dataset.type.replace('-', '_') : 'dine_in';
        
        // Prepare update data
        const updateData = {
            id: currentOrderId,
            items: orderItems,
            total_amount: totalAmount,
            order_type: orderType
        };
        
        console.log('📤 Sending update data:', updateData);
        
        // Send PUT request to update the order
        const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/orders.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📥 Database sync result:', result);
        
        if (result.status === 'success') {
            console.log('✅ Order successfully synced to database');
            return true;
        } else {
            console.error('❌ Database sync failed:', result.message);
            return false;
        }
        
    } catch (error) {
        console.error('🚨 Error syncing to database:', error);
        return false;
    }
}

// Debug: Make functions globally accessible
window.lookupOrder = function() {
    console.log('🎯 Global lookupOrder called!');
    return lookupOrderInternal();
};

// Make sure functions are in global scope
window.onlyNumbers = function(e) {
    return onlyNumbers(e);
};

// DateTime update function
function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString();
    document.getElementById('datetime').textContent = `${dateString} ${timeString}`;
    
    // Check if date has changed since last stored date
    checkForDateChange(now);
}

// Check for date change to reset queue numbers
function checkForDateChange(currentDate) {
    const currentDateStr = currentDate.toLocaleDateString();
    const lastDateStr = localStorage.getItem('lastDate');
    
    if (lastDateStr && lastDateStr !== currentDateStr) {
        // Reset queue number to 1 if the date has changed
        localStorage.setItem('queueNumber', '1');
        document.getElementById('queueNumber').value = '1';
    }
    
    // Update stored date
    localStorage.setItem('lastDate', currentDateStr);
}

// Initialize queue number
function initializeQueueNumber() {
    // Check if queue number exists in localStorage
    let queueNumber = localStorage.getItem('queueNumber');
    if (!queueNumber) {
        queueNumber = '1';
        localStorage.setItem('queueNumber', queueNumber);
    }
    
    // Display queue number
    document.getElementById('queueNumber').value = queueNumber;
    
    // Initialize last date if not set
    if (!localStorage.getItem('lastDate')) {
        localStorage.setItem('lastDate', new Date().toLocaleDateString());
    }
}

// Cancel order function - now checks if order is empty
function cancelOrder() {
    // Check if order is empty
    const total = document.getElementById('total').textContent;
    
    if (total === 'Total Amount: ₱0.00') {
        showEmptyOrderWarningModal();
        return;
    }
    
    // If order has items, show confirmation modal
    showCancelOrderModal();
}

// Show empty order warning modal
function showEmptyOrderWarningModal() {
    const modal = document.getElementById('emptyOrderWarningModal');
    modal.classList.add('show');
}

// Close empty order warning modal
function closeEmptyOrderWarningModal() {
    const modal = document.getElementById('emptyOrderWarningModal');
    modal.classList.remove('show');
}

// Show cancel order confirmation modal
function showCancelOrderModal() {
    const modal = document.getElementById('cancelOrderModal');
    modal.classList.add('show');
}

// Close cancel order modal
function closeCancelOrderModal() {
    const modal = document.getElementById('cancelOrderModal');
    modal.classList.remove('show');
}

// Confirm cancel order - clear everything and reset
function confirmCancelOrder() {
    // Clear all order data
    document.getElementById('orderNumber').value = '';
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('names-container').innerHTML = '';
    document.getElementById('addons-container').innerHTML = '';
    document.getElementById('prices-container').innerHTML = '';
    document.getElementById('total').textContent = 'Total Amount: ₱0.00';
    
    // Reset order type selection
    document.querySelectorAll('.type-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reset the current order ID for database synchronization
    currentOrderId = null;
    console.log('🔄 Order ID reset for database sync');
    
    // Close the modal
    closeCancelOrderModal();
    
    console.log('Order cancelled and reset');
}

// Queue number generator
function generateQueueNumber() {
    let currentCount = parseInt(localStorage.getItem('queueCount') || '0');
    currentCount = (currentCount + 1) % 10000;
    localStorage.setItem('queueCount', currentCount);
    const queueNumber = String(currentCount).padStart(4, '0');
    document.getElementById('queueNumber').value = queueNumber;
}

// Sample orders data
const sampleOrders = {
    '001': [
        { quantity: 2, name: 'Cappuccino', price: 150 },
        { quantity: 1, name: 'Croissant', price: 80 }
    ]
};

// Item style for grid
const itemStyle = `
    padding: 8px;
    margin: 5px;
    background-color: #fff;
    border-radius: 5px;
    text-align: left;
`;

// Main functions
async function lookupOrderInternal() {
    console.log('🔍 lookupOrder() function called!');
    
    const orderNum = document.getElementById('orderNumber').value.trim();
    
    console.log('Looking up order number:', orderNum);
    
    if (!orderNum) {
        showOrderNumberRequiredModal();
        return;
    }
    
    try {
        // Show loading state
        const lookupButton = document.querySelector('button[onclick="lookupOrder()"]');
        const originalText = lookupButton.textContent;
        lookupButton.textContent = 'Looking up...';        lookupButton.disabled = true;
        
        const apiUrl = `http://localhost/SOURCE_CODE/Employee/public/api/orders.php?order_number=${orderNum}`;
        console.log('🌐 Fetching from URL:', apiUrl);
        
        // Fetch order from database (XAMPP htdocs path)
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 Response received, status:', response.status, 'ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Order lookup result:', result);        if (result.status === 'success' && result.order) {
            console.log('✅ Order found successfully!');
            const order = result.order;
            console.log('📦 Order details:', order);
            
            // Store the order ID for database synchronization
            currentOrderId = order.id;
            console.log('🔗 Stored order ID for sync:', currentOrderId);
            
            // The order already includes items, no need for second API call
            if (order.items && order.items.length > 0) {
                console.log('🍽️ Processing order items:', order.items.length, 'items');
                clearContainers();
                
                // Display order information
                displayOrderInfo(order);                // Add each item to the display
                order.items.forEach(item => {
                    console.log('➕ Adding item:', item);
                    const addons = item.addons || [];
                    // Use unit_price for display, total_price is for internal
                    const displayPrice = item.unit_price;
                    addOrderItemFromDB(item.quantity, item.product_name, displayPrice, item.total_price, addons);
                });
                
                // Set the correct total from the order
                const totalElement = document.getElementById('total');
                totalElement.textContent = `Total Amount: ₱${parseFloat(order.total_amount).toFixed(2)}`;
                
                const orderTypeDisplay = order.order_type || 'Not specified';
                console.log('🎉 Order processing complete!');
                console.log(`Order ${orderNum} displayed in cashier interface!`);
                // Remove the alert and just log success
                console.log('Order lookup completed successfully');
            } else {
                console.log('⚠️ Order found but no items available');
                console.log('Items array:', order.items);
                throw new Error('Order found but no items available');
            }
        } else {
            console.log('❌ Order lookup failed:', result);
            showOrderNotFoundModal(result.message || 'Order not found');
        }
    } catch (error) {
        console.error('🚨 Error looking up order:', error);
        showLookupErrorModal('Error looking up order: ' + error.message);
    } finally {
        // Restore button state
        console.log('🔄 Restoring button state');
        const lookupButton = document.querySelector('button[onclick="lookupOrder()"]');
        if (lookupButton) {
            lookupButton.textContent = 'Look Up';
            lookupButton.disabled = false;
        }
    }
}

// Function to display order information
function displayOrderInfo(order) {
    // Set order type buttons based on the order
    const typeButtons = document.querySelectorAll('.type-button');
    typeButtons.forEach(btn => {
        btn.classList.remove('active');
        
        // Handle empty order_type by defaulting to dine-in
        const orderType = order.order_type || 'dine_in';
        
        // Convert button data-type to match database format
        const buttonType = btn.dataset.type.replace('-', '_');
        
        if (buttonType === orderType) {
            btn.classList.add('active');
        }
    });
}

function handleAddItem() {
    const quantity = document.getElementById('quantity').value;
    const name = document.getElementById('productName').value;
    const price = document.getElementById('price').value;

    if (!quantity || !name || !price) {
        // Replace alert with modal
        showInvalidInputModal();
        return;
    }

    addOrderItem(quantity, name, price);
    clearInputs();
}

// Add function for invalid input modal (if not already exists)
function showInvalidInputModal() {
    const modal = document.getElementById('invalidQuantityModal');
    const messageElement = modal.querySelector('.error-message');
    messageElement.textContent = 'Please fill all fields';
    modal.classList.add('show');
}

function addOrderItem(quantity, name, price, addons) {
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');

    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = itemStyle;
    itemDiv.innerHTML = `${quantity} 
        <button onclick="editItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #4A2C1B; color: white; border: none; border-radius: 3px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #ff4444; color: white; border: none; border-radius: 3px;">Delete</button>`;
    
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = itemStyle;
    nameDiv.textContent = name;
    
    // Add-ons display
    const addonsDiv = document.createElement('div');
    addonsDiv.style.cssText = itemStyle;
    if (addons && Array.isArray(addons) && addons.length > 0) {
        addonsDiv.textContent = addons.map(a => a.name).join(', ');
    } else {
        addonsDiv.textContent = '-';
    }

    const priceDiv = document.createElement('div');
    priceDiv.style.cssText = itemStyle;
    priceDiv.textContent = `₱${parseFloat(price).toFixed(2)}`;

    itemsContainer.appendChild(itemDiv);
    namesContainer.appendChild(nameDiv);
    addonsContainer.appendChild(addonsDiv);
    pricesContainer.appendChild(priceDiv);
    
    updateTotal();
}

// Function specifically for adding items retrieved from database
function addOrderItemFromDB(quantity, name, displayPrice, totalPrice, addons) {
    console.log(`📋 Adding DB item: ${quantity}x ${name} @ ₱${displayPrice} (total: ₱${totalPrice})`);
    
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');

    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = itemStyle;
    itemDiv.innerHTML = `${quantity} 
        <button onclick="editItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #4A2C1B; color: white; border: none; border-radius: 3px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #ff4444; color: white; border: none; border-radius: 3px;">Delete</button>`;
    
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = itemStyle;
    nameDiv.textContent = name;
    
    // Add-ons display
    const addonsDiv = document.createElement('div');
    addonsDiv.style.cssText = itemStyle;
    if (addons && Array.isArray(addons) && addons.length > 0) {
        addonsDiv.textContent = addons.map(a => a.name).join(', ');
    } else {
        addonsDiv.textContent = '-';
    }

    // Show the unit price, but store total price for calculation
    const priceDiv = document.createElement('div');
    priceDiv.style.cssText = itemStyle;
    priceDiv.textContent = `₱${parseFloat(displayPrice).toFixed(2)}`;
    // Store the actual total price as a data attribute for accurate calculation
    priceDiv.setAttribute('data-total-price', totalPrice);

    itemsContainer.appendChild(itemDiv);
    namesContainer.appendChild(nameDiv);
    addonsContainer.appendChild(addonsDiv);
    pricesContainer.appendChild(priceDiv);
    
    // Don't call updateTotal() here - we'll set the total manually from the order
}

function updateTotal() {
    const quantities = document.getElementById('items-container').children;
    const names = document.getElementById('names-container').children;
    const addons = document.getElementById('addons-container').children;
    const prices = document.getElementById('prices-container').children;
    let total = 0;

    for (let i = 0; i < quantities.length; i++) {
        const quantity = parseInt(quantities[i].childNodes[0].textContent.trim());
        const itemName = names[i].textContent.trim();
        const addonsText = addons[i].textContent.trim();
        
        // Step 1: Calculate the updated unit price (original + add-ons)
        const originalPrice = getBasePrice(itemName);
        let totalAddOnsPrice = 0;
        
        // Calculate total add-ons price if there are any
        if (addonsText !== '-' && addonsText) {
            const addonsList = addonsText.split(', ').map(a => a.trim());
            totalAddOnsPrice = addonsList.reduce((sum, addonName) => {
                return sum + getAddonPrice(addonName);
            }, 0);
        }
        
        // Step 2: Update unit price = original + total add-ons
        const unitPrice = originalPrice + totalAddOnsPrice;
        
        // Step 3: Calculate total amount = unit price × quantity
        const lineTotal = unitPrice * quantity;
        
        // Update the displayed price to reflect the correct line total
        prices[i].textContent = `₱${lineTotal.toFixed(2)}`;
        
        // Add to grand total
        total += lineTotal;
    }
    
    document.getElementById('total').textContent = `Total Amount: ₱${total.toFixed(2)}`;
}

function handleConfirm() {
    const total = document.getElementById('total').textContent;
    const queueNum = document.getElementById('queueNumber').value;

    // Check if items are added to the order
    if (total === 'Total Amount: ₱0.00') {
        showNoItemsWarningModal();
        return;
    }

    // Check if an order type is selected
    const selectedOrderType = document.querySelector('.type-button.active');
    if (!selectedOrderType) {
        showOrderTypeWarningModal();
        return;
    }

    // Get order type text
    const orderTypeText = selectedOrderType.textContent.trim();

    // Collect order items
    const orderItems = [];
    const quantities = document.getElementById('items-container').children;
    const names = document.getElementById('names-container').children;
    const addons = document.getElementById('addons-container').children;
    const prices = document.getElementById('prices-container').children;

    for (let i = 0; i < quantities.length; i++) {
        // Extract quantity (first text node before the buttons)
        const qtyText = quantities[i].childNodes[0].textContent.trim();
        const qty = parseInt(qtyText);
        
        const name = names[i].textContent.trim();
        const addonText = addons[i].textContent.trim();
        const priceText = prices[i].textContent.replace('₱', '').trim();
        const totalPrice = parseFloat(priceText);
        
        orderItems.push({
            quantity: qty,
            name: name,
            addons: addonText !== '-' ? addonText.split(', ') : [],
            price: totalPrice / qty, // Unit price
            totalPrice: totalPrice   // Total price for this line
        });
    }

    // Create complete order data object
    const orderData = {
        items: orderItems,
        total: total.replace('Total Amount: ₱', ''),
        queueNumber: queueNum,
        orderType: orderTypeText,
        datetime: document.getElementById('datetime').textContent,
        itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0)
    };

    console.log('Sending order data to confirmation:', orderData);
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    window.location.href = 'orderconfirm.html';
}

// Show no items warning modal
function showNoItemsWarningModal() {
    const modal = document.getElementById('noItemsWarningModal');
    modal.classList.add('show');
}

// Close no items warning modal
function closeNoItemsWarningModal() {
    const modal = document.getElementById('noItemsWarningModal');
    modal.classList.remove('show');
}

// Show order type warning modal
function showOrderTypeWarningModal() {
    const modal = document.getElementById('orderTypeWarningModal');
    modal.classList.add('show');
}

// Close order type warning modal
function closeOrderTypeWarningModal() {
    const modal = document.getElementById('orderTypeWarningModal');
    modal.classList.remove('show');
}

// Handle order type selection from modal
function selectOrderTypeFromModal(orderType) {
    // Update the main order type buttons
    document.querySelectorAll('.type-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === orderType) {
            btn.classList.add('active');
        }
    });
    
    // Close the modal
    closeOrderTypeWarningModal();
    
    // Automatically proceed with confirmation
    handleConfirm();
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setInterval(updateDateTime, 1000);
    generateQueueNumber();
    updateDateTime();

    // Add event listeners for buttons
    document.querySelector('.cancel-button').addEventListener('click', handleCancel);
    document.querySelector('.confirm-button').addEventListener('click', handleConfirm);
    
    // Add menu button click handler
    const menuButton = document.querySelector('.menu-button');
    if(menuButton) {
        menuButton.addEventListener('click', goToMenu);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check for newly added items
    const newItems = JSON.parse(localStorage.getItem('newAddedItems') || '[]');
    
    if (newItems.length > 0) {
        // Add items to the grid
        newItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'grid-row flash-highlight';
            row.innerHTML = `
                <div>${item.quantity}</div>
                <div>${item.name}</div>
                <div>₱${item.price.toFixed(2)}</div>
            `;
            document.getElementById('items-container').appendChild(row);
        });
        
        // Clear the stored items
        localStorage.removeItem('newAddedItems');
        
        // Update total
        updateTotal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check for newly added items from menu
    const newItems = JSON.parse(localStorage.getItem('newAddedItems') || '[]');
    
    if (newItems.length > 0) {
        newItems.forEach(item => {
            // Create the item elements with flash effect
            const quantityElement = document.createElement('div');
            quantityElement.textContent = item.quantity;
            quantityElement.classList.add('flash-highlight');
            
            const nameElement = document.createElement('div');
            nameElement.textContent = item.name;
            nameElement.classList.add('flash-highlight');
            
            const priceElement = document.createElement('div');
            priceElement.textContent = `₱${(item.price * item.quantity).toFixed(2)}`;
            priceElement.classList.add('flash-highlight');
            
            // Add to containers
            document.getElementById('items-container').appendChild(quantityElement);
            document.getElementById('names-container').appendChild(nameElement);
            document.getElementById('prices-container').appendChild(priceElement);
        });
        
        // Clear storage after adding
        localStorage.removeItem('newAddedItems');
        
        // Update total amount
        updateTotal();
    }
});

// Function to populate grid items from localStorage
function populateGridFromStorage() {
    const newItems = JSON.parse(localStorage.getItem('newAddedItems') || '[]');
    
    if (newItems.length > 0) {
        newItems.forEach(item => {
            // Create grid items with flash effect
            const quantityElement = document.createElement('div');
            quantityElement.textContent = item.quantity;
            quantityElement.classList.add('flash-highlight');
            
            const nameElement = document.createElement('div');
            nameElement.textContent = item.name;
            nameElement.classList.add('flash-highlight');
            
            const priceElement = document.createElement('div');
            priceElement.textContent = `₱${item.price.toFixed(2)}`;
            priceElement.classList.add('flash-highlight');
            
            // Add to containers
            document.getElementById('items-container').appendChild(quantityElement);
            document.getElementById('names-container').appendChild(nameElement);
            document.getElementById('prices-container').appendChild(priceElement);
        });
        
        // Clear storage after adding
        localStorage.removeItem('newAddedItems');
        
        // Update total amount
        updateTotal();
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    populateGridFromStorage();
});

// Handler functions
function handleCancel() {
    // Remove confirm() and just call cancelOrder which handles modals
    cancelOrder();
}

// Menu navigation function - now opens modal instead of redirecting
function goToMenu() {
    // Show the add item modal
    showAddItemModal();
}

// Helper function to get current order items
function getOrderItems() {
    const items = [];
    const quantities = document.getElementById('items-container').children;
    const names = document.getElementById('names-container').children;
    const addons = document.getElementById('addons-container') ? document.getElementById('addons-container').children : [];
    const prices = document.getElementById('prices-container').children;

    for(let i = 0; i < quantities.length; i++) {
        items.push({
            quantity: parseInt(quantities[i].childNodes[0].textContent.trim()),
            name: names[i].textContent,
            // For now, add-ons are not editable in cashiering, so just display
            addons: addons[i] ? addons[i].textContent.split(',').map(a => a.trim()).filter(a => a && a !== '-') : [],
            price: parseFloat(prices[i].textContent.replace('₱', ''))
        });
    }
    return items;
}

// Utility functions
function clearContainers() {
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('names-container').innerHTML = '';
    if (document.getElementById('addons-container')) {
        document.getElementById('addons-container').innerHTML = '';
    }
    document.getElementById('prices-container').innerHTML = '';
}

function clearInputs() {
    document.getElementById('quantity').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('price').value = '';
}

function clearOrder() {
    clearContainers();
    clearInputs();
    document.getElementById('orderNumber').value = '';
    document.getElementById('total').textContent = 'Total Amount: ₱0.00';
}

// Order type selection
document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        localStorage.setItem('selectedOrderType', btn.dataset.type);
    });
});

// Order lookup functionality
function lookupOrder() {
    const orderNumber = document.getElementById('orderNumber').value;
    if (!orderNumber) {
        showOrderNumberRequiredModal();
        return;
    }

    // Get order details from localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);

    if (order) {
        showOrderInfo(order);
    } else {
        showOrderNotFoundModal('Order not found');
    }
}

function showOrderInfo(order) {
    // Create info display element
    const display = document.createElement('div');
    display.className = 'order-info-display';
    display.innerHTML = `
        <h3>Order #${order.orderNumber}</h3>
        <p>Type: ${order.type}</p>
        <p>Items: ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}</p>
        <p>Total: ₱${order.total.toFixed(2)}</p>
    `;

    document.body.appendChild(display);
    display.style.display = 'block';

    // Remove after animation
    setTimeout(() => {
        display.remove();
    }, 3000);
}

// Add type button functionality
document.querySelectorAll('.type-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.type-button').forEach(btn => 
            btn.classList.remove('active'));
        button.classList.add('active');
        localStorage.setItem('orderType', button.dataset.type);
    });
});

// Enhance lookupOrder function
function lookupOrder() {
    const orderNumber = document.getElementById('orderNumber').value;
    if (!orderNumber) {
        showOrderNumberRequiredModal();
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);

    if (order) {
        showOrderDetails(order);
    } else {
        showOrderNotFoundModal('Order not found');
    }
}

function showOrderDetails(order) {
    // Create flash element
    const flash = document.createElement('div');
    flash.className = 'order-details-flash';
    flash.innerHTML = `
        <h3>Order #${order.orderNumber}</h3>
        <p>Type: ${order.type}</p>
        <p>Items: ${order.items.map(item => 
            `${item.name} x${item.quantity}`).join(', ')}</p>
        <p>Total: ₱${order.total.toFixed(2)}</p>
    `;

    document.body.appendChild(flash);
    flash.style.display = 'block';

    // Remove after animation
    setTimeout(() => {
        flash.remove();
    }, 3000);
}

// Add this function to restrict input to numbers only
function onlyNumbers(e) {
    const char = String.fromCharCode(e.which);
    if (!(/[0-9]/.test(char))) {
        e.preventDefault();
        return false;
    }
}

// On page load, check if there is an updated order from menuinterface
document.addEventListener('DOMContentLoaded', function() {
    // Check for updated order from menuinterface
    const updatedOrder = JSON.parse(localStorage.getItem('updatedOrderFromMenu') || 'null');
    if (updatedOrder) {
        clearContainers();
        updatedOrder.items.forEach(item => {
            addOrderItem(
                item.quantity,
                item.name,
                item.total ? (item.total / item.quantity) : item.price, // Use per-item price if possible
                item.addons
            );
        });
        updateTotal();
        // Update order type button if present
        if (updatedOrder.orderType) {
            document.querySelectorAll('.type-button').forEach(btn => {
                if (
                    btn.textContent.trim().toLowerCase() === updatedOrder.orderType.trim().toLowerCase() ||
                    btn.dataset.type.replace('-', ' ').replace('out', 'out').toLowerCase() === updatedOrder.orderType.trim().toLowerCase()
                ) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        localStorage.removeItem('updatedOrderFromMenu');
    }
});

// ============ ADD ITEM MODAL FUNCTIONALITY ============

let selectedCoffeeItem = null;
let modalOrderItems = {};
let modalInitialized = false;
let currentActiveCoffee = null; // Add the missing currentActiveCoffee variable declaration

// Show the add item modal
function showAddItemModal() {
    const modal = document.getElementById('addItemModal');
    modal.classList.add('show');
    
    // Reset modal state
    resetModalState();
    
    // Initialize modal functionality only once
    if (!modalInitialized) {
        initializeModalFunctionality();
        modalInitialized = true;
    }
}

// Close the add item modal
function closeAddItemModal() {
    const modal = document.getElementById('addItemModal');
    modal.classList.remove('show');
    
    // Reset all selections and quantities
    resetModalState();
}

// Reset modal state
function resetModalState() {
    selectedCoffeeItem = null;
    modalOrderItems = {};
    
    // Reset all quantities to 0
    document.querySelectorAll('#addItemModal .quantity-value').forEach(value => {
        value.textContent = '0';
    });
    
    // Reset all minus buttons to disabled
    document.querySelectorAll('#addItemModal .quantity-btn.minus').forEach(btn => {
        btn.disabled = true;
    });
    
    // Remove selected classes
    document.querySelectorAll('#addItemModal .food-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Reset add-ons
    document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
        addon.classList.remove('selected');
        addon.removeAttribute('data-for-item');
    });
    
    // Reset selected item display
    const selectedItemName = document.querySelector('#addItemModal .selected-item-name');
    if (selectedItemName) {
        selectedItemName.textContent = 'Select a coffee item first';
        selectedItemName.classList.add('none-selected');
    }
    
    // Show coffee category by default
    showCategory('coffee');
}

// Initialize modal functionality
function initializeModalFunctionality() {
    // Category switching
    const categoryButtons = document.querySelectorAll('#addItemModal .category-button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            showCategory(category);
        });
    });
    
    // Food item selection and quantity controls
    const foodItems = document.querySelectorAll('#addItemModal .food-item');
    foodItems.forEach(item => {
        // Item selection
        item.addEventListener('click', function(e) {
            if (e.target.closest('.quantity-btn')) {
                e.stopPropagation();
                return;
            }
            selectFoodItem(this);
        });
        
        // Quantity controls
        const minusBtn = item.querySelector('.quantity-btn.minus');
        const plusBtn = item.querySelector('.quantity-btn.plus');
        const valueSpan = item.querySelector('.quantity-value');
        
        minusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            decreaseQuantity(item, valueSpan, minusBtn);
        });
        
        plusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            increaseQuantity(item, valueSpan, minusBtn);
        });
    });
    
    // Add-on selection
    const addons = document.querySelectorAll('#addItemModal .addon-circle');
    addons.forEach(addon => {
        addon.addEventListener('click', function() {
            toggleAddon(this);
        });
    });
}

// Show specific category
function showCategory(category) {
    // Update category buttons
    document.querySelectorAll('#addItemModal .category-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide grids
    const coffeeGrid = document.querySelector('#addItemModal .coffee-grid');
    const snacksGrid = document.querySelector('#addItemModal .snacks-grid');
    const addonsSection = document.querySelector('#addItemModal .addons-section');
    
    if (category === 'coffee') {
        coffeeGrid.classList.add('active');
        snacksGrid.classList.remove('active');
        addonsSection.style.display = 'block';
        // Enable add-on functionality for coffee
        enableAddons();
    } else {
        snacksGrid.classList.add('active');
        coffeeGrid.classList.remove('active');
        addonsSection.style.display = 'block'; // Keep visible
        // Disable add-on functionality for non-coffee items
        disableAddons();
    }
    
    // Reset selections when switching categories
    document.querySelectorAll('#addItemModal .food-item').forEach(item => {
        item.classList.remove('selected');
    });
    selectedCoffeeItem = null;
    currentActiveCoffee = null;
    
    // Reset selected item display
    updateAddonDisplay();
}

// Select food item
function selectFoodItem(item) {
    // Get current quantity and UI elements
    const quantityValue = item.querySelector('.quantity-value');
    const minusBtn = item.querySelector('.quantity-btn.minus');
    const currentQuantity = parseInt(quantityValue.textContent);
    
    // Check if this is a coffee item and specifically hot/cold coffee
    const isCoffeeItem = item.closest('.coffee-grid') !== null;
    const isHotOrColdCoffee = isCoffeeItem && isHotOrColdCoffeeItem(item);
    
    if (isCoffeeItem) {
        // For coffee items, implement individual toggle behavior
        if (currentQuantity === 0) {
            // Select this coffee item and set quantity to 1
            item.classList.add('selected');
            quantityValue.textContent = '1';
            minusBtn.disabled = false;
            
            // Set this as the current active coffee for add-ons (only if hot/cold coffee)
            if (isHotOrColdCoffee) {
                currentActiveCoffee = item;
            } else {
                currentActiveCoffee = null;
            }
            
            updateModalOrderItem(item);
            
            // Update the add-on display
            updateAddonDisplay();
        } else {
            // Deselect this coffee item and set quantity to 0
            item.classList.remove('selected');
            quantityValue.textContent = '0';
            minusBtn.disabled = true;
            
            const foodName = item.querySelector('.food-name').textContent;
            
            // Clear any add-ons associated with this item (only for hot/cold coffee)
            if (isHotOrColdCoffee) {
                document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
                    if (addon.getAttribute('data-for-item') === foodName) {
                        addon.classList.remove('selected');
                        addon.removeAttribute('data-for-item');
                    }
                });
            }
            
            // If this was the active coffee, find another selected hot/cold coffee or clear
            if (currentActiveCoffee === item) {
                const otherSelectedCoffee = document.querySelector('#addItemModal .coffee-grid .food-item.selected');
                currentActiveCoffee = (otherSelectedCoffee && isHotOrColdCoffeeItem(otherSelectedCoffee)) ? otherSelectedCoffee : null;
            }
            
            removeModalOrderItem(item);
            
            // Update the add-on display
            updateAddonDisplay();
        }
    } else {
        // For non-coffee items (snacks), implement individual toggle behavior
        // No add-ons functionality for snacks
        if (currentQuantity === 0) {
            // Select and set quantity to 1
            item.classList.add('selected');
            quantityValue.textContent = '1';
            minusBtn.disabled = false;
            updateModalOrderItem(item);
        } else {
            // Deselect and set quantity to 0
            item.classList.remove('selected');
            quantityValue.textContent = '0';
            minusBtn.disabled = true;
            removeModalOrderItem(item);
        }
        
        // Ensure currentActiveCoffee is null for non-coffee items
        currentActiveCoffee = null;
        updateAddonDisplay();
    }
}

// Helper function to check if item is Hot Coffee or Cold Coffee
function isHotOrColdCoffeeItem(item) {
    const itemName = item.querySelector('.food-name').textContent;
    const hotCoffeeItems = ['Espresso', 'Cappuccino', 'Americano', 'Latte', 'Macha'];
    const coldCoffeeItems = ['Iced Latte', 'Iced Americano', 'Cold Brew', 'Frappuccino', 'Affogato'];
    
    return hotCoffeeItems.includes(itemName) || coldCoffeeItems.includes(itemName);
}

// Increase quantity
function increaseQuantity(item, valueSpan, minusBtn) {
    let value = parseInt(valueSpan.textContent);
    value++;
    valueSpan.textContent = value;
    minusBtn.disabled = false;
    item.classList.add('selected');
    
    // If this is a hot/cold coffee item, set it as the current active coffee
    const isCoffeeItem = item.closest('.coffee-grid') !== null;
    if (isCoffeeItem && isHotOrColdCoffeeItem(item)) {
        currentActiveCoffee = item;
        updateAddonDisplay();
    } else {
        // For non-hot/cold coffee items, ensure currentActiveCoffee is null
        currentActiveCoffee = null;
        updateAddonDisplay();
    }
    
    updateModalOrderItem(item);
}

// Decrease quantity
function decreaseQuantity(item, valueSpan, minusBtn) {
    let value = parseInt(valueSpan.textContent);
    if (value > 0) {
        value--;
        valueSpan.textContent = value;
        minusBtn.disabled = value === 0;
        
        if (value === 0) {
            item.classList.remove('selected');
            
            // If this was the active coffee, find another selected hot/cold coffee or clear
            const isCoffeeItem = item.closest('.coffee-grid') !== null;
            if (isCoffeeItem && isHotOrColdCoffeeItem(item) && currentActiveCoffee === item) {
                const otherSelectedCoffee = document.querySelector('#addItemModal .coffee-grid .food-item.selected');
                currentActiveCoffee = (otherSelectedCoffee && isHotOrColdCoffeeItem(otherSelectedCoffee)) ? otherSelectedCoffee : null;
                updateAddonDisplay();
            } else if (!isCoffeeItem || !isHotOrColdCoffeeItem(item)) {
                // For non-hot/cold coffee items, ensure currentActiveCoffee is null
                currentActiveCoffee = null;
                updateAddonDisplay();
            }
            
            removeModalOrderItem(item);
        } else {
            updateModalOrderItem(item);
        }
    }
}

// Toggle add-on selection
function toggleAddon(addon) {
    // Check if we're in coffee category and have an active hot/cold coffee item
    const currentCategory = document.querySelector('#addItemModal .category-button.active')?.dataset.category;
    
    if (currentCategory !== 'coffee') {
        // Should not happen since add-ons are disabled for non-coffee, but just in case
        return;
    }
    
    if (!currentActiveCoffee || !currentActiveCoffee.classList.contains('selected') || !isHotOrColdCoffeeItem(currentActiveCoffee)) {
        // Flash the "Select an item first" text
        const selectedItemName = document.querySelector('#addItemModal .selected-item-name');
        selectedItemName.style.animation = 'none';
        setTimeout(() => {
            selectedItemName.style.animation = 'flash 0.5s 2';
        }, 10);
        return;
    }
    
    const foodName = currentActiveCoffee.querySelector('.food-name').textContent;
    const isCurrentlySelected = addon.classList.contains('selected') && addon.getAttribute('data-for-item') === foodName;
    
    if (isCurrentlySelected) {
        // Remove selection if it was associated with this item
        addon.classList.remove('selected');
        addon.removeAttribute('data-for-item');
    } else {
        // Add selection and associate with current active coffee
        addon.classList.add('selected');
        addon.setAttribute('data-for-item', foodName);
    }
    
    // Update the order item with new add-ons
    updateModalOrderItem(currentActiveCoffee);
}

// Show selection modal for which coffee item to add the add-on to
function showCoffeeSelectionForAddon(addon, selectedCoffeeItems) {
    // Create a simple selection interface
    const addonName = addon.getAttribute('data-name');
    
    // Create a temporary selection div
    const selectionDiv = document.createElement('div');
    selectionDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #8B4513;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        text-align: center;
    `;
    
    selectionDiv.innerHTML = `
        <h4 style="margin-top: 0; color: #8B4513;">Add ${addonName} to which coffee?</h4>
        <div id="coffee-selection-buttons" style="margin: 15px 0;"></div>
        <button onclick="this.parentElement.remove()" style="background: #ccc; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Cancel</button>
    `;
    
    const buttonsContainer = selectionDiv.querySelector('#coffee-selection-buttons');
    
    // Add button for each selected coffee item
    selectedCoffeeItems.forEach(coffeeItem => {
        const foodName = coffeeItem.querySelector('.food-name').textContent;
        const button = document.createElement('button');
        button.textContent = foodName;
        button.style.cssText = `
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 10px;
            background: #8B4513;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        button.onclick = () => {
            // Add the add-on to this specific coffee item
            const isCurrentlySelected = addon.classList.contains('selected') && addon.getAttribute('data-for-item') === foodName;
            
            if (isCurrentlySelected) {
                // Remove if already selected for this item
                addon.classList.remove('selected');
                addon.removeAttribute('data-for-item');
            } else {
                // Add to this coffee item
                addon.classList.add('selected');
                addon.setAttribute('data-for-item', foodName);
            }
            
            // Update the order item
            updateModalOrderItem(coffeeItem);
            
            // Update the display to show which item has add-ons
            updateAddonDisplay();
            
            // Remove the selection modal
            selectionDiv.remove();
        };
        
        // Highlight if this coffee already has this add-on
        if (addon.getAttribute('data-for-item') === foodName) {
            button.style.background = '#A0522D';
            button.innerHTML = `${foodName} ✓`;
        }
        
        buttonsContainer.appendChild(button);
    });
    
    document.body.appendChild(selectionDiv);
}

// Update the add-on display to show current associations
function updateAddonDisplay() {
    const selectedItemName = document.querySelector('#addItemModal .selected-item-name');
    const currentCategory = document.querySelector('#addItemModal .category-button.active')?.dataset.category;
    
    // Only show add-on functionality for coffee category
    if (currentCategory !== 'coffee') {
        selectedItemName.textContent = 'Add-ons not available for snacks';
        selectedItemName.classList.add('none-selected');
        
        // Clear all add-on visual selections
        document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
            addon.classList.remove('selected');
        });
        return;
    }
    
    if (!currentActiveCoffee || !currentActiveCoffee.classList.contains('selected') || !isHotOrColdCoffeeItem(currentActiveCoffee)) {
        // Check if we have any hot/cold coffee selected
        const hasHotColdCoffeeSelected = Array.from(document.querySelectorAll('#addItemModal .coffee-grid .food-item.selected'))
            .some(item => isHotOrColdCoffeeItem(item));
        
        if (hasHotColdCoffeeSelected) {
            selectedItemName.textContent = 'Select a hot or cold coffee item for add-ons';
        } else {
            selectedItemName.textContent = 'Add-ons only available for hot/cold coffee';
        }
        selectedItemName.classList.add('none-selected');
        
        // Clear all add-on visual selections (but keep the data attributes)
        document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
            addon.classList.remove('selected');
        });
    } else {
        const foodName = currentActiveCoffee.querySelector('.food-name').textContent;
        selectedItemName.textContent = foodName;
        selectedItemName.classList.remove('none-selected');
        
        // Show add-ons for the current active coffee item
        document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
            if (addon.getAttribute('data-for-item') === foodName) {
                addon.classList.add('selected');
            } else {
                addon.classList.remove('selected');
            }
        });
    }
}

// Disable add-ons functionality
function disableAddons() {
    // Clear any selected add-ons
    document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
        addon.classList.remove('selected');
        addon.removeAttribute('data-for-item');
        addon.style.opacity = '0.5';
        addon.style.pointerEvents = 'none';
        addon.style.cursor = 'not-allowed';
    });
    
    // Clear currentActiveCoffee since we're not in coffee section or with hot/cold coffee
    currentActiveCoffee = null;
}

// Enable add-ons functionality
function enableAddons() {
    const addonsSection = document.querySelector('#addItemModal .addons-section');
    if (addonsSection) {
        addonsSection.style.opacity = '1';
        addonsSection.style.pointerEvents = 'auto';
        
        // Enable all add-on circles
        document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
            addon.style.opacity = '1';
            addon.style.pointerEvents = 'auto';
            addon.style.cursor = 'pointer';
        });
    }
}

// Update modal order item with proper pricing
function updateModalOrderItem(item) {
    const name = item.dataset.name;
    const originalPrice = parseFloat(item.dataset.price);
    const quantity = parseInt(item.querySelector('.quantity-value').textContent);
    
    if (quantity > 0) {
        // Get associated add-ons and calculate total add-on price (only for hot/cold coffee items)
        const addons = [];
        let totalAddOnsPrice = 0;
        
        const isCoffeeItem = item.closest('.coffee-grid') !== null;
        if (isCoffeeItem && isHotOrColdCoffeeItem(item)) {
            document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
                if (addon.getAttribute('data-for-item') === name) {
                    const addonPrice = parseFloat(addon.dataset.price);
                    addons.push({
                        name: addon.dataset.name,
                        price: addonPrice
                    });
                    totalAddOnsPrice += addonPrice;
                }
            });
        }
        
        // Step 1: Calculate unit price = original + total add-ons
        const unitPrice = originalPrice + totalAddOnsPrice;
        
        modalOrderItems[name] = {
            name: name,
            price: unitPrice, // Store the calculated unit price
            quantity: quantity,
            addons: addons
        };
    } else {
        delete modalOrderItems[name];
    }
}

// Remove modal order item
function removeModalOrderItem(item) {
    const name = item.dataset.name;
    delete modalOrderItems[name];
    
    // Remove associated add-ons
    document.querySelectorAll('#addItemModal .addon-circle').forEach(addon => {
        if (addon.getAttribute('data-for-item') === name) {
            addon.classList.remove('selected');
            addon.removeAttribute('data-for-item');
        }
    });
}

// Add selected items to the main order
function addSelectedItems() {
    const itemsToAdd = Object.values(modalOrderItems);
    
    if (itemsToAdd.length === 0) {
        showNoItemsSelectedModal();
        return;
    }
    
    // Add items to the main order
    itemsToAdd.forEach(item => {
        // Use the calculated price that already includes add-ons
        const totalPrice = item.price;
        
        // Add each quantity as a separate item (matching the database structure)
        for (let i = 0; i < item.quantity; i++) {
            // Add to grid with same structure as database items
            addItemToGrid(item.name, totalPrice, item.addons);
        }
    });
    
    // Update total
    updateTotal();
    
    // Sync changes to database if we have an order ID
    if (currentOrderId) {
        syncOrderToDatabase().then(success => {
            if (success) {
                console.log('✅ Add items changes synced to database');
            } else {
                console.warn('⚠️ Failed to sync add items changes to database');
            }
        });
    }
    
    // Close modal
    closeAddItemModal();
}

// Add item to the main cashiering grid
function addItemToGrid(name, price, addons = []) {
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');
    
    // Format add-ons for comparison
    const addonsText = addons && Array.isArray(addons) && addons.length > 0 
        ? addons.map(a => a.name || a).join(', ') 
        : '-';
    
    // Check for existing item with same name and add-ons
    let existingRowIndex = -1;
    for (let i = 0; i < namesContainer.children.length; i++) {
        const existingName = namesContainer.children[i].textContent;
        const existingAddons = addonsContainer.children[i].textContent;
        
        if (existingName === name && existingAddons === addonsText) {
            existingRowIndex = i;
            break;
        }
    }
    
    if (existingRowIndex !== -1) {
        // Update existing item quantity
        const quantityElement = itemsContainer.children[existingRowIndex];
        
        // Extract current quantity
        const currentQuantity = parseInt(quantityElement.textContent.trim().split(' ')[0]);
        const newQuantity = currentQuantity + 1;
        
        // Update quantity display with buttons
        quantityElement.innerHTML = `${newQuantity} 
            <button onclick="editItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #4A2C1B; color: white; border: none; border-radius: 3px;">Edit</button>
            <button onclick="deleteItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #ff4444; color: white; border: none; border-radius: 3px;">Delete</button>`;
        
        // Let updateTotal() recalculate with correct pricing logic
        updateTotal();
    } else {
        // Create new row
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = itemStyle;
        itemDiv.innerHTML = `1 
            <button onclick="editItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #4A2C1B; color: white; border: none; border-radius: 3px;">Edit</button>
            <button onclick="deleteItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #ff4444; color: white; border: none; border-radius: 3px;">Delete</button>`;
        
        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = itemStyle;
        nameDiv.textContent = name;
        
        const addonsDiv = document.createElement('div');
        addonsDiv.style.cssText = itemStyle;
        addonsDiv.textContent = addonsText;
        
        const priceDiv = document.createElement('div');
        priceDiv.style.cssText = itemStyle;
        
        // Step 1: Get original price
        const originalPrice = getBasePrice(name);
        
        // Step 2: Calculate total add-ons price
        let totalAddOnsPrice = 0;
        if (addons && Array.isArray(addons) && addons.length > 0) {
            totalAddOnsPrice = addons.reduce((sum, addon) => {
                const addonName = addon.name || addon;
                return sum + getAddonPrice(addonName);
            }, 0);
        }
        
        // Step 3: Calculate unit price = original + total add-ons
        const unitPrice = originalPrice + totalAddOnsPrice;
        
        // Step 4: Set price display (quantity is 1 for new items)
        priceDiv.textContent = `₱${unitPrice.toFixed(2)}`;
        
        itemsContainer.appendChild(itemDiv);
        namesContainer.appendChild(nameDiv);
        addonsContainer.appendChild(addonsDiv);
        pricesContainer.appendChild(priceDiv);
        
        // Recalculate total using the updated calculation logic
        updateTotal();
    }
}

// Sample base prices for items
function getBasePrice(itemName) {
    // Return base prices for items - adjust these according to your actual prices
    const prices = {
        'Espresso': 120,
        'Cappuccino': 150,
        'Americano': 130,
        'Latte': 140,
        'Macha': 145,
        'Iced Latte': 140,
        'Iced Americano': 130,
        'Cold Brew': 140,
        'Frappuccino': 160,
        'Affogato': 155,
        'Strawberry Italian Soda': 110,
        'Lemon-Lime Fizz': 110,
        'Raspberry Spritzer': 115,
        'Donut': 80,
        'Apple Pie': 90,
        'Cinnamon Roll': 70,
        'Sugar Cookie': 60,
        'Brownie': 75,
        'BLT (Bacon, Lettuce, Tomato)': 180,
        'Club Sandwich': 190,
        'Ham and Cheese Sandwich': 160,
        'Tuna Salad Sandwich': 170,
        'Chocolate Cake': 200,
        'Cheesecake': 220,
        'Carrot Cake': 190,
        'Black Forest Cake': 210,
        'Red Velvet Cake': 215
    };
    return prices[itemName] || 100; // Default price if not found
}

// Get price of add-ons
function getAddonPrice(addonName) {
    // Return prices for add-ons
    const addonPrices = {
        'Extra Milk': 15,
        'Extra Sugar': 10,
        'Whipped Cream': 20,
        'Caramel Syrup': 25
    };
    return addonPrices[addonName] || 0;
}

// ============ EDIT ITEM FUNCTIONALITY ============

let currentEditingIndex = -1;

function editItem(button) {
    console.log('Edit item clicked');
    
    // Get the row index
    const itemDiv = button.parentNode;
    const itemsContainer = document.getElementById('items-container');
    const rowIndex = Array.from(itemsContainer.children).indexOf(itemDiv);
    
    if (rowIndex === -1) {
        console.error('Could not find row index');
        return;
    }
    
    currentEditingIndex = rowIndex;
    
    // Get item data from the grid
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');
    
    const quantity = parseInt(itemDiv.childNodes[0].textContent.trim());
    const itemName = namesContainer.children[rowIndex].textContent;
    const addonsText = addonsContainer.children[rowIndex].textContent;
    const totalPrice = parseFloat(pricesContainer.children[rowIndex].textContent.replace('₱', ''));
    
    console.log(`Editing: ${itemName}, Qty: ${quantity}, Price: ${totalPrice}, Add-ons: ${addonsText}`);
    
    // Show edit modal and populate with current data
    showEditModal(itemName, quantity, addonsText, totalPrice);
}

function showEditModal(itemName, quantity, addonsText, totalPrice) {
    const modal = document.getElementById('editItemModal');
    
    // Populate modal with current item data
    modal.querySelector('.edit-item-name').textContent = itemName;
    modal.querySelector('.quantity-value').textContent = quantity;
    
    // Check if this item is a hot/cold coffee item
    const isHotOrColdCoffee = isHotOrColdCoffeeItemByName(itemName);
    
    // Handle add-ons section visibility and functionality
    const addonsSection = modal.querySelector('.edit-addons-section');
    const addonBoxes = modal.querySelectorAll('.edit-addon-box');
    
    if (isHotOrColdCoffee) {
        // Enable add-ons for hot/cold coffee
        addonsSection.style.opacity = '1';
        addonBoxes.forEach(addon => {
            addon.style.opacity = '1';
            addon.style.pointerEvents = 'auto';
            addon.style.cursor = 'pointer';
        });
        
        // Handle add-ons selection for coffee items
        const addonsArray = addonsText !== '-' ? addonsText.split(', ').map(a => a.trim()) : [];
        
        // Clear previous selections
        addonBoxes.forEach(addon => {
            addon.classList.remove('selected');
        });
        
        // Select current add-ons
        addonsArray.forEach(addonName => {
            const addonBox = Array.from(addonBoxes).find(box => {
                const spanText = box.querySelector('span').textContent;
                return spanText === addonName;
            });
            if (addonBox) {
                addonBox.classList.add('selected');
            }
        });
    } else {
        // Disable add-ons for non-coffee items
        addonsSection.style.opacity = '0.5';
        addonBoxes.forEach(addon => {
            addon.classList.remove('selected');
            addon.style.opacity = '0.3';
            addon.style.pointerEvents = 'none';
            addon.style.cursor = 'not-allowed';
        });
    }
    
    // Show modal
    modal.classList.add('show');
    
    // Set up event handlers if not already set
    setupEditModalHandlers();
}

// Helper function to check if item name belongs to hot/cold coffee categories
function isHotOrColdCoffeeItemByName(itemName) {
    const hotCoffeeItems = ['Espresso', 'Cappuccino', 'Americano', 'Latte', 'Macha'];
    const coldCoffeeItems = ['Iced Latte', 'Iced Americano', 'Cold Brew', 'Frappuccino', 'Affogato'];
    
    return hotCoffeeItems.includes(itemName) || coldCoffeeItems.includes(itemName);
}

function setupEditModalHandlers() {
    const modal = document.getElementById('editItemModal');
    
    // Close button
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn && !closeBtn.hasAttribute('data-handler-set')) {
        closeBtn.addEventListener('click', closeEditModal);
        closeBtn.setAttribute('data-handler-set', 'true');
    }
    
    // Quantity controls
    const minusBtn = modal.querySelector('.minus-btn');
    const plusBtn = modal.querySelector('.plus-btn');
    const quantitySpan = modal.querySelector('.quantity-value');
    
    if (minusBtn && !minusBtn.hasAttribute('data-handler-set')) {
        minusBtn.addEventListener('click', () => {
            let qty = parseInt(quantitySpan.textContent);
            if (qty > 1) {
                qty--;
                quantitySpan.textContent = qty;
            }
        });
        minusBtn.setAttribute('data-handler-set', 'true');
    }
    
    if (plusBtn && !plusBtn.hasAttribute('data-handler-set')) {
        plusBtn.addEventListener('click', () => {
            let qty = parseInt(quantitySpan.textContent);
            qty++;
            quantitySpan.textContent = qty;
        });
        plusBtn.setAttribute('data-handler-set', 'true');
    }
    
    // Add-on selection - only set handlers if not already set
    modal.querySelectorAll('.edit-addon-box').forEach(addon => {
        if (!addon.hasAttribute('data-handler-set')) {
            addon.addEventListener('click', () => {
                // Only allow selection if the add-on is enabled (has pointer events)
                const computedStyle = window.getComputedStyle(addon);
                if (computedStyle.pointerEvents !== 'none') {
                    addon.classList.toggle('selected');
                }
            });
            addon.setAttribute('data-handler-set', 'true');
        }
    });
    
    // Save and cancel buttons
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    if (saveBtn && !saveBtn.hasAttribute('data-handler-set')) {
        saveBtn.addEventListener('click', saveEditedItem);
        saveBtn.setAttribute('data-handler-set', 'true');
    }
    
    if (cancelBtn && !cancelBtn.hasAttribute('data-handler-set')) {
        cancelBtn.addEventListener('click', closeEditModal);
        cancelBtn.setAttribute('data-handler-set', 'true');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editItemModal');
    modal.classList.remove('show');
    currentEditingIndex = -1;
}

function saveEditedItem() {
    if (currentEditingIndex === -1) {
        console.error('No item being edited');
        return;
    }
    
    const modal = document.getElementById('editItemModal');
    const newQuantity = parseInt(modal.querySelector('.quantity-value').textContent);
    const itemName = modal.querySelector('.edit-item-name').textContent;
    
    // Check if this is a hot/cold coffee item to determine if add-ons should be processed
    const isHotOrColdCoffee = isHotOrColdCoffeeItemByName(itemName);
    
    // Get selected add-ons only for hot/cold coffee items
    const selectedAddons = [];
    if (isHotOrColdCoffee) {
        modal.querySelectorAll('.edit-addon-box.selected').forEach(addon => {
            const addonName = addon.querySelector('span').textContent;
            selectedAddons.push(addonName);
        });
    }
    
    // Update the grid
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');
    
    const itemDiv = itemsContainer.children[currentEditingIndex];
    
    // Step 1: Get original price
    const originalPrice = getBasePrice(itemName);
    
    // Step 2: Calculate total add-ons price (only for hot/cold coffee)
    let totalAddOnsPrice = 0;
    if (isHotOrColdCoffee) {
        totalAddOnsPrice = selectedAddons.reduce((sum, addonName) => {
            return sum + getAddonPrice(addonName);
        }, 0);
    }
    
    // Step 3: Calculate updated unit price = original + total add-ons
    const unitPrice = originalPrice + totalAddOnsPrice;
    
    // Step 4: Calculate total amount = unit price × quantity
    const totalPrice = unitPrice * newQuantity;
    
    // Update quantity display
    itemDiv.innerHTML = `${newQuantity} 
        <button onclick="editItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #4A2C1B; color: white; border: none; border-radius: 3px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px; font-size: 12px; padding: 2px 6px; cursor: pointer; background-color: #ff4444; color: white; border: none; border-radius: 3px;">Delete</button>`;
    
    // Update add-ons display (only show add-ons for hot/cold coffee)
    if (isHotOrColdCoffee) {
        addonsContainer.children[currentEditingIndex].textContent = selectedAddons.length > 0 ? selectedAddons.join(', ') : '-';
    } else {
        addonsContainer.children[currentEditingIndex].textContent = '-';
    }
    
    // Update price display with calculated total
    pricesContainer.children[currentEditingIndex].textContent = `₱${totalPrice.toFixed(2)}`;
    
    // Recalculate total using the updated calculation logic
    updateTotal();
    
    // Sync to database if we have an order ID
    if (currentOrderId) {
        syncOrderToDatabase().then(success => {
            if (success) {
                console.log('✅ Edit changes synced to database');
            } else {
                console.warn('⚠️ Failed to sync edit changes to database');
            }
        });
    }
    
    // Close modal
    closeEditModal();
}

// ============ DELETE ITEM FUNCTIONALITY ============

let deleteItemIndex = -1;

function deleteItem(button) {
    console.log('Delete item clicked');
    
    // Get the row index
    const itemDiv = button.parentNode;
    const itemsContainer = document.getElementById('items-container');
    const rowIndex = Array.from(itemsContainer.children).indexOf(itemDiv);
    
    if (rowIndex === -1) {
        console.error('Could not find row index');
        return;
    }
    
    deleteItemIndex = rowIndex;
    
    // Get item name for confirmation
    const namesContainer = document.getElementById('names-container');
    const itemName = namesContainer.children[rowIndex].textContent;
    
    // Show delete confirmation modal
    showDeleteItemModal(itemName);
}

function showDeleteItemModal(itemName) {
    const modal = document.getElementById('deleteItemModal');
    const messageElement = modal.querySelector('.delete-message');
    messageElement.textContent = `Are you sure you want to remove "${itemName}" from the order?`;
    modal.classList.add('show');
}

function closeDeleteItemModal() {
    const modal = document.getElementById('deleteItemModal');
    modal.classList.remove('show');
    deleteItemIndex = -1;
}

function confirmDeleteItem() {
    if (deleteItemIndex === -1) {
        console.error('No item selected for deletion');
        return;
    }
    
    // Remove item from all containers
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');
    
    itemsContainer.removeChild(itemsContainer.children[deleteItemIndex]);
    namesContainer.removeChild(namesContainer.children[deleteItemIndex]);
    addonsContainer.removeChild(addonsContainer.children[deleteItemIndex]);
    pricesContainer.removeChild(pricesContainer.children[deleteItemIndex]);
    
    // Update total
    updateTotal();
    
    // Sync to database if we have an order ID
    if (currentOrderId) {
        syncOrderToDatabase().then(success => {
            if (success) {
                console.log('✅ Delete changes synced to database');
            } else {
                console.warn('⚠️ Failed to sync delete changes to database');
            }
        });
    }
    
    // Close modal
    closeDeleteItemModal();
    
    console.log('Item deleted successfully');
}

// Make functions globally accessible
window.editItem = editItem;
window.deleteItem = deleteItem;
window.addSelectedItems = addSelectedItems;
window.closeAddItemModal = closeAddItemModal;
window.showAddItemModal = showAddItemModal;
window.closeOrderNumberRequiredModal = closeOrderNumberRequiredModal;
window.closeOrderNotFoundModal = closeOrderNotFoundModal;
window.closeLookupErrorModal = closeLookupErrorModal;
window.closeNoItemsSelectedModal = closeNoItemsSelectedModal;
window.closeInvalidQuantityModal = closeInvalidQuantityModal;
window.closeDeleteItemModal = closeDeleteItemModal;
window.confirmDeleteItem = confirmDeleteItem;
window.lookupOrder = function() {
    console.log('🎯 Global lookupOrder called!');
    return lookupOrderInternal();
};

// ============ LOOKUP MODAL FUNCTIONS ============

// Show order number required modal
function showOrderNumberRequiredModal() {
    const modal = document.getElementById('orderNumberRequiredModal');
    modal.classList.add('show');
}

// Close order number required modal
function closeOrderNumberRequiredModal() {
    const modal = document.getElementById('orderNumberRequiredModal');
    modal.classList.remove('show');
}

// Show order not found modal
function showOrderNotFoundModal(message) {
    const modal = document.getElementById('orderNotFoundModal');
    const messageElement = modal.querySelector('.error-message');
    messageElement.textContent = message || 'Order not found';
    modal.classList.add('show');
}

// Close order not found modal
function closeOrderNotFoundModal() {
    const modal = document.getElementById('orderNotFoundModal');
    modal.classList.remove('show');
}

// Show lookup error modal
function showLookupErrorModal(message) {
    const modal = document.getElementById('lookupErrorModal');
    const messageElement = modal.querySelector('.error-message');
    messageElement.textContent = message || 'An error occurred while looking up the order.';
    modal.classList.add('show');
}

// Close lookup error modal
function closeLookupErrorModal() {
    const modal = document.getElementById('lookupErrorModal');
    modal.classList.remove('show');
}

// Show no items selected modal
function showNoItemsSelectedModal() {
    const modal = document.getElementById('noItemsSelectedModal');
    modal.classList.add('show');
}

// Close no items selected modal
function closeNoItemsSelectedModal() {
    const modal = document.getElementById('noItemsSelectedModal');
    modal.classList.remove('show');
}

// Show invalid input modal
function showInvalidQuantityModal() {
    const modal = document.getElementById('invalidQuantityModal');
    modal.classList.add('show');
}

// Close invalid quantity modal
function closeInvalidQuantityModal() {
    const modal = document.getElementById('invalidQuantityModal');
    modal.classList.remove('show');
}
