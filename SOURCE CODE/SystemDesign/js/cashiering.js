// Test to verify JS file is loading
console.log('cashiering.js file loaded successfully');

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

// Cancel order function
function cancelOrder() {
    // Reset form or navigate away
    if (confirm('Are you sure you want to cancel this order?')) {
        // Clear fields and reset
        document.getElementById('orderNumber').value = '';
        document.getElementById('items-container').innerHTML = '';
        document.getElementById('names-container').innerHTML = '';
        document.getElementById('addons-container').innerHTML = '';
        document.getElementById('prices-container').innerHTML = '';
        document.getElementById('total').textContent = 'Total Amount: ₱0.00';
    }
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
        alert('Please enter an order number');
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
            
            // The order already includes items, no need for second API call
            if (order.items && order.items.length > 0) {
                console.log('🍽️ Processing order items:', order.items.length, 'items');
                clearContainers();
                
                // Display order information
                displayOrderInfo(order);                // Add each item to the display
                order.items.forEach(item => {
                    console.log('➕ Adding item:', item);
                    const addons = item.addons || [];
                    // Use unit_price for display, total_price is for internal calculation
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
            alert(result.message || 'Order not found');
        }
    } catch (error) {
        console.error('🚨 Error looking up order:', error);
        alert('Error looking up order: ' + error.message);
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
        alert('Please fill all fields');
        return;
    }

    addOrderItem(quantity, name, price);
    clearInputs();
}

function addOrderItem(quantity, name, price, addons) {
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const addonsContainer = document.getElementById('addons-container');
    const pricesContainer = document.getElementById('prices-container');

    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = itemStyle;
    itemDiv.innerHTML = `${quantity} 
        <button onclick="editItem(this)" style="margin-left: 5px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px;">Delete</button>`;
    
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
        <button onclick="editItem(this)" style="margin-left: 5px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px;">Delete</button>`;
    
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
    const prices = document.getElementById('prices-container').children;
    let total = 0;

    for (let i = 0; i < quantities.length; i++) {
        const quantity = parseInt(quantities[i].childNodes[0].textContent.trim());
        const price = parseFloat(prices[i].textContent.replace('₱', ''));
        total += quantity * price;
    }
    
    document.getElementById('total').textContent = `Total Amount: ₱${total.toFixed(2)}`;
}

function handleConfirm() {
    const total = document.getElementById('total').textContent;
    const queueNum = document.getElementById('queueNumber').value;

    if (total === 'Total Amount: ₱0.00') {
        alert('Please add items first');
        return;
    }

    const orderItems = [];
    const quantities = document.getElementById('items-container').children;
    const names = document.getElementById('names-container').children;
    const prices = document.getElementById('prices-container').children;

    for (let i = 0; i < quantities.length; i++) {
        const qty = parseInt(quantities[i].childNodes[0].textContent.trim());
        const price = parseFloat(prices[i].textContent.replace('₱', ''));
        orderItems.push({
            quantity: qty,
            name: names[i].textContent,
            price: price,
            subtotal: qty * price
        });
    }

    const orderData = {
        items: orderItems,
        total: total,
        queueNumber: queueNum,
        datetime: document.getElementById('datetime').textContent
    };

    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    window.location.href = 'orderconfirm.html';

    // Get the selected order type
    const orderType = document.querySelector('.type-button.active')?.dataset.type || 'dine-in';
    
    // Prepare receipt data
    const receiptData = {
        items: getCurrentOrderItems(),
        queueNumber: document.getElementById('queueNumber').value,
        orderType: orderType === 'dine-in' ? 'Dine In' : 'Take Out',
        // ...other receipt data
    };
    
    // Save to localStorage
    localStorage.setItem('receiptData', JSON.stringify(receiptData));
    
    // Navigate to receipt page
    window.location.href = 'receiptinter.html';
}

// Add CSS animation for fade in effect
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Event Listeners
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
    if(confirm('Are you sure you want to cancel this order?')) {
        clearOrder();
        window.location.href = 'cashiering.html';
    }
}

// Menu navigation function
function goToMenu() {
    // Save current order state
    const orderState = {
        queueNumber: document.getElementById('queueNumber').value,
        currentItems: getOrderItems(),
        datetime: document.getElementById('datetime').textContent,
        total: document.getElementById('total').textContent
    };
    // Save to localStorage for menuinterface to access
    localStorage.setItem('pendingOrder', JSON.stringify(orderState));
    // Navigate to menuinterface.html
    window.location.href = 'menuinterface.html';
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
    if (!orderNumber) return;

    // Get order details from localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);

    if (order) {
        showOrderInfo(order);
    } else {
        alert('Order not found');
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
    if (!orderNumber) return;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);

    if (order) {
        showOrderDetails(order);
    } else {
        alert('Order not found');
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
