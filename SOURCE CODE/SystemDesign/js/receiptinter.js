function updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dateTimeString = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${formatTime(now)}`;
    
    document.getElementById('receipt-datetime').textContent = dateTimeString;
    document.getElementById('queue-datetime').textContent = dateTimeString;
}

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes}${ampm}`;
}

function formatMoney(value) {
    if (typeof value === 'string') {
        if (value.startsWith('₱')) {
            value = value.substring(1);
        }
        value = parseFloat(value);
    }
    return isNaN(value) ? '₱0.00' : `₱${value.toFixed(2)}`;
}

function updateCashierName() {
    // Get the logged-in user data from sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('user')) || {};
    const cashierName = userData.name || 'Unknown Cashier';
    
    // Update the cashier name on the receipt
    document.getElementById('cashier-name').textContent = cashierName;
}

window.onload = function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const receiptData = JSON.parse(localStorage.getItem('receiptData'));
    if (!receiptData) {
        alert('No receipt data found');
        window.location.href = 'cashiering.html';
        return;
    }

    updateCashierName(); // Add this line to update cashier name

    // Update order details
    document.getElementById('order-type').textContent = receiptData.orderType || 'Not specified';
    document.querySelector('.queue-number').textContent = receiptData.queueNumber;
    document.querySelector('.queue-slip .number').textContent = receiptData.queueNumber;

    // Display order items
    displayOrderItems(receiptData.items);

    // Display payment details
    const totals = document.querySelectorAll('.total-line .amount');
    totals[0].textContent = formatMoney(receiptData.total);
    totals[1].textContent = formatMoney(receiptData.cash);
    totals[2].textContent = formatMoney(receiptData.change);
};

function displayOrderItems(items) {
    const container = document.getElementById('orderItemsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'item';
        
        // Format the main item line with quantity and name
        const mainLine = `<span class="item-main">${item.name} x${item.quantity}</span>`;
        
        // Format add-ons with smaller font if they exist
        const addonsLine = item.addons && item.addons.length > 0 
            ? `<span class="addon-text">+ ${Array.isArray(item.addons) ? item.addons.join(', ') : item.addons}</span>` 
            : '';
        
        // Format price
        const priceLine = `<span class="price">₱${item.totalPrice.toFixed(2)}</span>`;
        
        row.innerHTML = `
            <div class="item-content">
                <div class="item-details">
                    ${mainLine}
                    ${addonsLine}
                </div>
                ${priceLine}
            </div>
        `;
        
        container.appendChild(row);
    });
}

document.getElementById('printBtn').addEventListener('click', function() {
    window.location.href = 'cashiering.html';
});
