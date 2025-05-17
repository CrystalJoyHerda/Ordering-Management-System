document.addEventListener('DOMContentLoaded', () => {
    // Get order items from localStorage
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    
    // Get the order summary container
    const orderSummary = document.querySelector('.order-summary');
    
    // Clear any existing content
    orderSummary.innerHTML = '<div class="order-header"></div>';
    
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
        window.location.href = 'menuinterface.html';    });
    
    // Handle confirm button
    document.querySelector('.confirm-button').addEventListener('click', () => {
        const orderNumber = Math.floor(Math.random() * 999) + 1;
        localStorage.setItem('lastOrderNumber', orderNumber.toString().padStart(3, '0'));
        alert(`Order #${orderNumber} confirmed!`);
        localStorage.removeItem('orderItems');
        window.location.href = 'orderconfirmation.html';
    });
});
