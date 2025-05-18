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

    displayReceiptData(receiptData);
};

function displayReceiptData(receiptData) {
    // Update queue numbers
    document.querySelector('.queue-number').textContent = receiptData.queueNumber;
    document.querySelector('.queue-slip .number').textContent = receiptData.queueNumber;

    // Display order items
    const orderItems = document.getElementById('orderItemsList');
    orderItems.innerHTML = '';
    
    receiptData.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        const subtotal = item.quantity * item.price;
        div.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <span>${formatMoney(subtotal)}</span>
        `;
        orderItems.appendChild(div);
    });

    // Update totals
    const totals = document.querySelectorAll('.total-line .amount');
    totals[0].textContent = receiptData.total;
    totals[1].textContent = receiptData.cash;
    totals[2].textContent = receiptData.change;
}
