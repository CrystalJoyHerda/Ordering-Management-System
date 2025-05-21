// DateTime update function
function updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const dateTimeString = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${hours}:${minutes}${ampm}`;
    document.getElementById('datetime').innerHTML = dateTimeString;
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
function lookupOrder() {
    const orderNum = document.getElementById('orderNumber').value;
    const order = sampleOrders[orderNum];
    
    if (!order) {
        alert('Order not found');
        return;
    }

    clearContainers();
    order.forEach(item => addOrderItem(item.quantity, item.name, item.price));
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

function addOrderItem(quantity, name, price) {
    const itemsContainer = document.getElementById('items-container');
    const namesContainer = document.getElementById('names-container');
    const pricesContainer = document.getElementById('prices-container');

    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = itemStyle;
    itemDiv.innerHTML = `${quantity} 
        <button onclick="editItem(this)" style="margin-left: 5px;">Edit</button>
        <button onclick="deleteItem(this)" style="margin-left: 5px;">Delete</button>`;
    
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = itemStyle;
    nameDiv.textContent = name;
    
    const priceDiv = document.createElement('div');
    priceDiv.style.cssText = itemStyle;
    priceDiv.textContent = `₱${parseFloat(price).toFixed(2)}`;

    itemsContainer.appendChild(itemDiv);
    namesContainer.appendChild(nameDiv);
    pricesContainer.appendChild(priceDiv);
    
    updateTotal();
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
    
    // Save to localStorage for menuinterface2 to access
    localStorage.setItem('pendingOrder', JSON.stringify(orderState));
    
    // Navigate to new menu interface
    window.location.href = 'menuinterface2.html';
}

// Helper function to get current order items
function getOrderItems() {
    const items = [];
    const quantities = document.getElementById('items-container').children;
    const names = document.getElementById('names-container').children;
    const prices = document.getElementById('prices-container').children;

    for(let i = 0; i < quantities.length; i++) {
        items.push({
            quantity: parseInt(quantities[i].childNodes[0].textContent.trim()),
            name: names[i].textContent,
            price: parseFloat(prices[i].textContent.replace('₱', ''))
        });
    }
    return items;
}

// Utility functions
function clearContainers() {
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('names-container').innerHTML = '';
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
