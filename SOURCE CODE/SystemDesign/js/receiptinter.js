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
    const userData = JSON.parse(sessionStorage.getItem('username')) || {};
    console.log('Cashier Name:', userData);

    // const cashierName = userData.name || 'Unknown Cashier';
    // // Update the cashier name on the receipt
    // document.getElementById('cashier-name').textContent = cashierName;
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cashier dashboard loaded');
    
    // Check if RBAC service is available
    if (typeof RBACService !== 'undefined') {
        // Enforce cashier-only access to this page
        RBACService.enforcePageAccess('cashier');
        
        // Get user data and display name
        const userData = RBACService.getUserData();
        if (userData) {
            const cashierNameElement = document.getElementById('cashier-name');
            if (cashierNameElement) {
                cashierNameElement.textContent = userData.name;
            }
        }    } else {
        // Fallback to basic authentication if RBAC is not available
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Not logged in, redirect to login
            window.location.href = '../pages/loginInterface.html';
            return;
        }
        
        try {
            // Decode token to get user data
            const payload = token.split('.')[1];
            const userData = JSON.parse(atob(payload));
            const user = userData.data;
            
            if (user.role !== 'cashier') {
                // Not a cashier, redirect to appropriate dashboard
                if (user.role === 'admin') {
                    window.location.href = 'admindashboard.html';
                } else {
                    window.location.href = '../loginInterface.html';
                }
                return;
            }
            
            // User is cashier, continue loading cashier dashboard
            // Display cashier name if element exists
            const cashierNameElement = document.getElementById('cashier-name');
            if (cashierNameElement) {
                cashierNameElement.textContent = user.name;
            }
            // document.getElementById('cashier-name').textContent = cashierName;
        } catch (e) {
            // Invalid token, redirect to login
            console.error('Token validation error:', e);
            // localStorage.removeItem('auth_token');
            // window.location.href = '../loginInterface.html';
            // return;
        }
    }
    });

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

document.getElementById('printBtn').addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.textContent;
    
    // Disable button to prevent double-clicks
    btn.disabled = true;
    btn.textContent = 'Printing...';
    
    // Get order data from localStorage
    const receiptData = JSON.parse(localStorage.getItem('receiptData'));
    console.log('🎫 Receipt data for printing:', receiptData);
    
    // If order has an ID, update its status to 'completed'
    if (receiptData && receiptData.orderId) {
        console.log('🎫 Receipt printing - updating order status for ID:', receiptData.orderId);
        btn.textContent = 'Updating Status...';
        
        try {
            const success = await updateOrderStatus(receiptData.orderId, 'completed');
            
            if (success) {
                console.log('✅ Order status updated successfully!');
                btn.textContent = 'Status Updated - Redirecting...';
                
                // Clear the order data from localStorage since it's completed
                localStorage.removeItem('receiptData');
                localStorage.removeItem('currentOrder');
                
            } else {
                console.error('❌ Failed to update order status');
                btn.textContent = 'Update Failed - Redirecting...';
            }
        } catch (error) {
            console.error('🚨 Error updating order status:', error);
            btn.textContent = 'Error - Redirecting...';
        }
        
        // Wait 2 seconds to ensure the update completes
        setTimeout(() => {
            window.location.href = 'cashiering.html';
        }, 2000);
        
    } else {
        console.warn('⚠️ Order ID not found in receipt data, cannot update status');
        console.log('Receipt data available:', receiptData);
        
        if (!receiptData) {
            console.error('❌ No receipt data found at all');
        } else if (!receiptData.orderId) {
            console.error('❌ Receipt data exists but missing orderId:', Object.keys(receiptData));
        }
        
        // Still redirect but immediately since no update needed
        setTimeout(() => {
            window.location.href = 'cashiering.html';
        }, 1000);
    }
});

/**
 * Updates the order status in the database
 * @param {number} orderId - The ID of the order
 * @param {string} status - The new status
 */
async function updateOrderStatus(orderId, status) {
    try {
        console.log(`🔄 Updating order ${orderId} status to ${status}...`);
        
        // Prepare the request body
        const requestBody = {
            id: orderId,
            status: status
        };
        
        console.log('📤 Sending status update request:', requestBody);

        const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/orders.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📡 Response status:', response.status, 'OK:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📥 Order status update result:', result);
        
        if (result.status === 'success') {
            console.log(`✅ Order ${orderId} status successfully updated to ${status}`);
            return true;
        } else {
            console.error('❌ Order status update failed:', result.message);
            return false;
        }
    } catch (error) {
        console.error('🚨 Error updating order status:', error);
        return false;
    }
}
