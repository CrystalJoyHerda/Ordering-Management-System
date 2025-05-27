document.addEventListener('DOMContentLoaded', function() {
    // Load order data
    const orderData = JSON.parse(localStorage.getItem('currentOrder'));
    if (!orderData) {
        console.log('No order found');
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
    orderData.items.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        
        // Format add-ons display - handle both array and string formats
        let addonsDisplay = '-';
        if (item.addons) {
            if (Array.isArray(item.addons) && item.addons.length > 0) {
                addonsDisplay = item.addons.join(', ');
            } else if (typeof item.addons === 'string' && item.addons.trim() !== '' && item.addons !== '-') {
                addonsDisplay = item.addons;
            }
        }
        
        // Create grid row with improved alignment and styling
        const row =
        row.style.cssText = 'display: grid; grid-template-columns: 0.8fr 2.5fr 2fr 1.2fr; padding: 12px 15px; background: white; margin-bottom: 4px; border-radius: 6px; border-left: 4px solid #4A2C1B; align-items: center; min-height: 50px;';
        row.innerHTML = `
            <div style="text-align: center; font-weight: bold; color: #333; font-size: 16px;">${item.quantity}</div>
            <div style="padding-left: 10px; font-weight: 500; color: #333; font-size: 15px; display: flex; align-items: center;">${item.name}</div>
            <div style="padding-left: 10px; color: #666; font-style: ${addonsDisplay === '-' ? 'italic' : 'normal'}; font-size: 14px; display: flex; align-items: center;">${addonsDisplay}</div>
            <div style="text-align: right; font-weight: bold; color: #4A2C1B; font-size: 16px; padding-right: 10px;">₱${itemTotal.toFixed(2)}</div>
        `;
        gridContent.appendChild(row);
    });

    // Set total amount with emphasis
    const totalElement = document.getElementById('totalAmount');
    totalElement.textContent = `₱${total.toFixed(2)}`;
    totalElement.style.fontWeight = 'bold';
    totalElement.style.fontSize = '18px';
    totalElement.style.color = '#4A2C1B';

    // Enable cash input handling
    const cashInput = document.getElementById('cashInput');
    cashInput.addEventListener('input', function() {
        const cash = parseFloat(this.value) || 0;
        const change = cash - total;
        const changeElement = document.getElementById('changeAmount');
        changeElement.textContent = change >= 0 ? `₱${change.toFixed(2)}` : '₱0.00';
        changeElement.style.color = change >= 0 ? '#4A2C1B' : '#ff4444';
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
        items: orderData.items.map(item => ({
            ...item,
            addons: item.addons || []  // Ensure add-ons are included in receipt
        })),
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
