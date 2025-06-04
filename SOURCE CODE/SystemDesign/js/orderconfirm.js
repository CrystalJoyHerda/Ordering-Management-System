document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded'); // Debug log
    loadOrderData();
    setupCashInputHandler();
    updateDateTime();
    setInterval(updateDateTime, 1000); // Update every second
});

function updateDateTime() {
    const now = new Date();
    
    // Format: 6/4/2025 6:39:42 PM
    const formattedDateTime = now.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        datetimeElement.textContent = formattedDateTime;
    }
}

function loadOrderData() {
    const orderData = JSON.parse(localStorage.getItem('currentOrder'));
    console.log('Loading order data:', orderData);
    
    if (!orderData) {
        alert('No order data found');
        window.location.href = 'cashiering.html';
        return;
    }

    // Display queue number
    document.querySelector('.queue-input input').value = orderData.queueNumber;
    
    // Display items in grid
    const gridContent = document.querySelector('.grid-content');
    if (gridContent) {
        gridContent.innerHTML = orderData.items.map(item => `
            <div style="display: grid; grid-template-columns: 0.8fr 2.5fr 2fr 1.2fr; padding: 12px 15px; background: white; margin-bottom: 4px; border-radius: 6px; border-left: 4px solid #4A2C1B;">
                <div style="text-align: center;">${item.quantity}</div>
                <div>${item.name}</div>
                <div>${item.addons.length > 0 ? item.addons.join(', ') : 'None'}</div>
                <div style="text-align: right;">₱${item.totalPrice.toFixed(2)}</div>
            </div>
        `).join('');
    }

    // Display total amount
    const totalAmount = document.getElementById('totalAmount');
    if (totalAmount) {
        totalAmount.textContent = `₱${orderData.total}`;
    }

    // Log order ID for debugging
    console.log('📋 Order confirmation - Order ID:', orderData.orderId);
}

function setupCashInputHandler() {
    console.log('Setting up cash input handler'); // Debug log
    
    const cashInput = document.getElementById('cashInput');
    const changeAmount = document.getElementById('changeAmount');
    const totalAmount = document.getElementById('totalAmount');

    console.log('Elements found:', {
        cashInput: !!cashInput,
        changeAmount: !!changeAmount,
        totalAmount: !!totalAmount
    }); // Debug log

    if (cashInput && changeAmount && totalAmount) {
        cashInput.addEventListener('input', function() {
            const cash = parseFloat(this.value) || 0;
            // Remove the peso sign and parse total
            const total = parseFloat(totalAmount.textContent.replace('₱', '')) || 0;
            
            // Calculate change only if cash is sufficient
            if (cash >= total) {
                const change = cash - total;
                changeAmount.textContent = `₱${change.toFixed(2)}`;
                changeAmount.style.color = '#000'; // Reset color
            } else {
                changeAmount.textContent = '₱0.00';
                changeAmount.style.color = '#ff0000'; // Red color for insufficient cash
            }
        });

        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            const printBtn = document.querySelector('.print-btn');
            console.log('Print button found:', printBtn); // Debug log
            
            if (printBtn) {
                // Clear any existing handlers
                printBtn.replaceWith(printBtn.cloneNode(true));
                const newPrintBtn = document.querySelector('.print-btn');
                
                newPrintBtn.addEventListener('click', function(e) {
                    console.log('=== Print button clicked ==='); // Debug log
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const cashValue = cashInput.value.trim();
                    const cash = parseFloat(cashValue);
                    const total = parseFloat(totalAmount.textContent.replace('₱', '')) || 0;
                    
                    console.log('Validation data:', {
                        cashValue: cashValue,
                        cash: cash,
                        total: total,
                        isValidCash: !isNaN(cash) && cash > 0,
                        isSufficient: cash >= total
                    }); // Debug log
                    
                    // Check if cash input is empty or invalid
                    if (!cashValue || isNaN(cash) || cash <= 0) {
                        console.log('Validation failed: Invalid cash input');
                        showInputAmountModal();
                        return;
                    }
                    
                    // Check if cash amount is less than total
                    if (cash < total) {
                        console.log('Validation failed: Insufficient cash');
                        showInvalidAmountModal();
                        return;
                    }
                    
                    // All validations passed
                    console.log('All validations passed, proceeding to receipt');
                    proceedToReceipt();
                });
                
                console.log('Event listener attached successfully');
            } else {
                console.error('Print button still not found after timeout!');
            }
        }, 100);
    } else {
        console.error('Required elements not found!');
    }
}

function proceedToReceipt() {
    console.log('=== Proceeding to receipt ===');
    
    try {
        const orderData = JSON.parse(localStorage.getItem('currentOrder'));
        const cashAmount = document.getElementById('cashInput').value;
        const totalAmount = document.getElementById('totalAmount').textContent;
        const changeAmount = document.getElementById('changeAmount').textContent;

        console.log('Order data:', orderData);
        console.log('Payment data:', { cashAmount, totalAmount, changeAmount });

        if (!orderData) {
            console.error('No order data found');
            showNoOrderDataModal();
            return;
        }

        if (!orderData.orderId) {
            console.error('No order ID found');
            showMissingOrderIdModal();
            return;
        }

        // Create receipt data
        const receiptData = {
            ...orderData,
            cash: `₱${parseFloat(cashAmount).toFixed(2)}`,
            total: totalAmount,
            change: changeAmount,
            orderId: orderData.orderId,
            timestamp: new Date().toISOString()
        };

        console.log('Receipt data to save:', receiptData);

        // Save receipt data
        localStorage.setItem('receiptData', JSON.stringify(receiptData));
        console.log('Receipt data saved successfully');

        // Navigate to receipt page
        console.log('Navigating to receiptinter.html');
        window.location.href = 'receiptinter.html';
        
    } catch (error) {
        console.error('Error in proceedToReceipt:', error);
        alert('An error occurred while processing the receipt. Please try again.');
    }
}

// Modal functions
function showInputAmountModal() {
    document.getElementById('inputAmountModal').classList.add('show');
}

function closeInputAmountModal() {
    document.getElementById('inputAmountModal').classList.remove('show');
}

function showInvalidAmountModal() {
    document.getElementById('invalidAmountModal').classList.add('show');
}

function closeInvalidAmountModal() {
    document.getElementById('invalidAmountModal').classList.remove('show');
}

function showNoOrderDataModal() {
    document.getElementById('noOrderDataModal').classList.add('show');
}

function closeNoOrderDataModal() {
    document.getElementById('noOrderDataModal').classList.remove('show');
    window.location.href = 'cashiering.html';
}

function showMissingOrderIdModal() {
    document.getElementById('missingOrderIdModal').classList.add('show');
}

function closeMissingOrderIdModal() {
    document.getElementById('missingOrderIdModal').classList.remove('show');
}

// Make functions globally accessible
window.proceedToReceipt = proceedToReceipt;
window.closeInputAmountModal = closeInputAmountModal;
window.closeInvalidAmountModal = closeInvalidAmountModal;
window.closeNoOrderDataModal = closeNoOrderDataModal;
window.closeMissingOrderIdModal = closeMissingOrderIdModal;
