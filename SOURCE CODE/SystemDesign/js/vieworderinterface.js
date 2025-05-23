document.addEventListener('DOMContentLoaded', () => {
    // Get order items from localStorage
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    
    // Get order type from localStorage
    const orderType = localStorage.getItem('orderType');
    
    // Get the order summary container
    const orderSummary = document.querySelector('.order-summary');
    
    // Clear any existing content
    orderSummary.innerHTML = '<div class="order-header"></div>';
    
    // Display order type if available
    if (orderType) {
        const orderTypeDisplay = document.createElement('div');
        orderTypeDisplay.className = 'order-type-display';
        orderTypeDisplay.textContent = `Order Type: ${orderType}`;
        orderSummary.appendChild(orderTypeDisplay);
    }
    
    let total = 0;
    
    // Add each item to the order summary
    orderItems.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="item-details">
                <input type="radio" name="order-item">
                <label>${item.name} x${item.quantity}</label>
            </div>
            <span class="price">₱${item.total.toFixed(2)}</span>
        `;
        orderSummary.appendChild(orderItem);
        total += item.total;
    });
    
    // Add total
    if (orderItems.length > 0) {
        const totalItem = document.createElement('div');
        totalItem.className = 'total';
        totalItem.innerHTML = `
            <span>Total:</span>
            <span class="price">₱${total.toFixed(2)}</span>
        `;
        orderSummary.appendChild(totalItem);
    }
    
    // Handle cancel button
    document.querySelector('.cancel-button').addEventListener('click', () => {
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        window.location.href = 'menuinterface.html';
    });
    
    // Handle confirm button
    document.querySelector('.confirm-button').addEventListener('click', () => {
        const orderNumber = Math.floor(Math.random() * 999) + 1;
        localStorage.setItem('lastOrderNumber', orderNumber.toString().padStart(3, '0'));
        alert(`Order #${orderNumber} confirmed!`);
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        window.location.href = 'orderconfirmation.html';
    });
});
