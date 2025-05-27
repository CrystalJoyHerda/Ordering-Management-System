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
    const num = parseFloat(value);
    return isNaN(num) ? '₱0.00' : `₱${num.toFixed(2)}`;
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

    // Update order type from cashiering
    const orderType = receiptData.orderType || localStorage.getItem('orderType') || '---';
    document.getElementById('order-type').textContent = orderType;

    displayReceiptData(receiptData);
};

function displayReceiptData(receiptData) {
    // Update queue numbers
    document.querySelector('.queue-number').textContent = receiptData.queueNumber;
    document.querySelector('.queue-slip .number').textContent = receiptData.queueNumber;

    // Display order items with complete details
    const orderItems = document.getElementById('orderItemsList');
    orderItems.innerHTML = '';
    
    receiptData.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        
        // Format item name with add-ons
        let itemDisplay = `${item.name} x${item.quantity}`;
        
        // Add add-ons if they exist
        if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
            const addonsText = item.addons.join(', ');
            itemDisplay += `\n  + ${addonsText}`;
        } else if (item.addons && typeof item.addons === 'string' && item.addons !== '-' && item.addons.trim()) {
            itemDisplay += `\n  + ${item.addons}`;
        }
        
        const subtotal = item.quantity * item.price;
        
        div.innerHTML = `
            <span style="white-space: pre-line; line-height: 1.4;">${itemDisplay}</span>
            <span style="align-self: flex-start;">${formatMoney(subtotal)}</span>
        `;
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px dotted #ddd;';
        
        orderItems.appendChild(div);
    });

    // Update totals
    const totals = document.querySelectorAll('.total-line .amount');
    totals[0].textContent = receiptData.total;
    totals[1].textContent = receiptData.cash;
    totals[2].textContent = receiptData.change;
}
