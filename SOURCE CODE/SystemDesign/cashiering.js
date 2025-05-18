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
});

// Handler functions
function handleCancel() {
    if(confirm('Are you sure you want to cancel this order?')) {
        clearOrder();
        window.location.href = 'cashiering.html';
    }
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
