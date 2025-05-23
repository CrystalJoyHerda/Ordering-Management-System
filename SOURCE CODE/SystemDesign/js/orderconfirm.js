document.addEventListener('DOMContentLoaded', function() {
    // Load order data
    const orderData = JSON.parse(localStorage.getItem('currentOrder'));
    if (!orderData) {
        alert('No order found');
        window.location.href = 'cashiering.html';
        return;
    }

    // Set queue number and datetime
    document.querySelector('.queue-input input').value = orderData.queueNumber;
    document.querySelector('.datetime').textContent = orderData.datetime;

    // Display order items in grid
    const gridContent = document.querySelector('.grid-content');
    gridContent.innerHTML = '';
    
    let total = 0;
    orderData.items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        
        const row = document.createElement('div');
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr; padding: 8px;';
        row.innerHTML = `
            <div>${item.quantity}</div>
            <div>${item.name}</div>
            <div>₱${itemTotal.toFixed(2)}</div>
        `;
        gridContent.appendChild(row);
    });

    // Set total amount
    document.getElementById('totalAmount').textContent = `₱${total.toFixed(2)}`;

    // Enable cash input handling
    const cashInput = document.getElementById('cashInput');
    cashInput.addEventListener('input', function() {
        const cash = parseFloat(this.value) || 0;
        const change = cash - total;
        document.getElementById('changeAmount').textContent = 
            change >= 0 ? `₱${change.toFixed(2)}` : '₱0.00';
    });
});

function handlePrint() {
    const cash = document.getElementById('cashInput').value;
    if (!cash) {
        alert('Please enter cash amount');
        return;
    }

    const orderData = JSON.parse(localStorage.getItem('currentOrder'));
    const totalAmount = document.getElementById('totalAmount').textContent;
    const changeAmount = document.getElementById('changeAmount').textContent;

    const receiptData = {
        items: orderData.items,
        total: totalAmount,
        cash: `₱${parseFloat(cash).toFixed(2)}`,
        change: changeAmount,
        queueNumber: orderData.queueNumber,
        datetime: orderData.datetime,
        cashierName: 'Ogille Dane Provido'
    };

    localStorage.setItem('receiptData', JSON.stringify(receiptData));
    window.location.href = 'receiptinter.html';
}
