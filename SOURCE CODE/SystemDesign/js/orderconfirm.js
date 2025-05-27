document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
    setupCashInputHandler();
});

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
}

function setupCashInputHandler() {
    const cashInput = document.getElementById('cashInput');
    const changeAmount = document.getElementById('changeAmount');
    const totalAmount = document.getElementById('totalAmount');

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

        // Add validation for print button
        const printBtn = document.querySelector('.print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', function(e) {
                const cash = parseFloat(cashInput.value) || 0;
                const total = parseFloat(totalAmount.textContent.replace('₱', '')) || 0;
                
                if (cash < total) {
                    e.preventDefault();
                    showInvalidCashModal();
                    return;
                }
                
                if (cash === 0) {
                    e.preventDefault();
                    showInvalidCashModal();
                    return;
                }
                
                handlePrint();
            });
        }
    }
}

// Show invalid cash amount modal
function showInvalidCashModal() {
    const modal = document.getElementById('invalidCashModal');
    modal.classList.add('show');
}

// Close invalid cash amount modal
function closeInvalidCashModal() {
    const modal = document.getElementById('invalidCashModal');
    modal.classList.remove('show');
}

function handlePrint() {
    const orderData = JSON.parse(localStorage.getItem('currentOrder'));
    const cashAmount = document.getElementById('cashInput').value;
    const totalAmount = document.getElementById('totalAmount').textContent;
    const changeAmount = document.getElementById('changeAmount').textContent;

    // Validate cash input - replace alert with modal
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
        showInvalidCashModal();
        return;
    }

    // Create complete receipt data
    const receiptData = {
        ...orderData,
        cash: `₱${parseFloat(cashAmount).toFixed(2)}`,
        total: totalAmount,
        change: changeAmount
    };

    // Store receipt data for the receipt page
    localStorage.setItem('receiptData', JSON.stringify(receiptData));
    console.log('Receipt data saved:', receiptData);
    
    // Navigate directly to receipt page without print dialog
    window.location.href = 'receiptinter.html';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('invalidCashModal');
    if (e.target === modal) {
        closeInvalidCashModal();
    }
});

// Make functions globally accessible
window.handlePrint = handlePrint;
