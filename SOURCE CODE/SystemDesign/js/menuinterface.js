// Immediately disable text selection before DOM is loaded
(function() {
    const style = document.createElement('style');
    style.textContent = `
        * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-tap-highlight-color: transparent;
        }
        input, textarea, .editable-field {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    // Disable text selection globally
    document.onselectstart = function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('editable-field')) {
            return false;
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing interface...");
    
    // Update datetime function
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        const dateTimeStr = now.toLocaleDateString('en-US', options);
        document.querySelector('.datetime').textContent = dateTimeStr;
    }
    
    // Initial datetime update and set interval
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Order type button selection
    const orderButtons = document.querySelectorAll('.order-button');
    orderButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log("Order button clicked:", button.textContent);
            // Remove active class from all buttons
            orderButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#e0e0e0';  // Reset to default
            });
            // Add active class and change background for clicked button
            button.classList.add('active');
            button.style.backgroundColor = '#ffffff';

            // Save order type to localStorage for cashiering sync
            localStorage.setItem('pendingOrderType', button.textContent.trim());
        });
    });

    // Category switching functionality
    const categoryButtons = document.querySelectorAll('.category-button');
    const coffeeGrid = document.querySelector('.coffee-grid');
    const snacksGrid = document.querySelector('.snacks-grid');

    // Show coffee grid by default
    coffeeGrid.classList.add('active');
    categoryButtons[0].classList.add('active');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update button states
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show appropriate grid
            if (button.textContent.toLowerCase() === 'coffee') {
                coffeeGrid.classList.add('active');
                snacksGrid.classList.remove('active');
            } else {
                snacksGrid.classList.add('active');
                coffeeGrid.classList.remove('active');
            }
        });
    });

    // Initialize stored order items
    let storedOrderItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');    // Function to check and update product availability - REAL DATABASE SYNC
    function updateProductAvailability() {
        console.log("=== CHECKING PRODUCT AVAILABILITY (DATABASE SYNC) ===");
        
        // Fetch real product data from the database API
        fetchProductsFromDatabase()
            .then(products => {
                console.log(`Found ${products.length} products from database:`, products);
                
                const productStatuses = {};
                products.forEach(product => {
                    const key = product.name.toLowerCase().trim();
                    productStatuses[key] = product.status;
                    console.log(`📦 Product: "${product.name}" -> Status: ${product.status}`);
                });
                
                console.log("Product status map from database:", productStatuses);
                
                // Get all food items on the page
                const foodItems = document.querySelectorAll('.food-item');
                console.log(`Found ${foodItems.length} food items on page`);
                
                // Update each food item based on its status
                foodItems.forEach((item, index) => {
                    const foodNameElement = item.querySelector('.food-name');
                    if (!foodNameElement) {
                        console.log(`⚠️ Item ${index} has no .food-name element`);
                        return;
                    }
                    
                    const foodName = foodNameElement.textContent.trim();
                    const productKey = foodName.toLowerCase().trim();
                    
                    console.log(`🔍 Checking item ${index}: "${foodName}" (key: "${productKey}")`);
                    
                    // Check for exact match first - NO PARTIAL MATCHING TO AVOID ERRORS
                    let status = productStatuses[productKey];
                    
                    console.log(`📊 Product "${foodName}" status: ${status || 'NOT FOUND'}`);
                    
                    // ONLY apply out-of-stock if we have an exact match AND status is inactive
                    if (status === 'inactive') {
                        item.classList.add('out-of-stock');
                        console.log(`❌ ${foodName} marked as OUT OF STOCK`);
                    } else {
                        item.classList.remove('out-of-stock');
                        console.log(`✅ ${foodName} marked as available (status: ${status || 'not found - defaulting to active'})`);
                    }
                });
                
                console.log("=== PRODUCT AVAILABILITY CHECK COMPLETE ===");
                
            })
            .catch(error => {
                console.error("Failed to fetch products from database:", error);
                console.log("Falling back to demo data...");
                // Fall back to demo data if API is not available
                initializeDemoInventoryData();
            });
    }

    // Function to fetch products from the database API
    async function fetchProductsFromDatabase() {
        try {
            console.log("🌐 Fetching products from database API...");
            
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/products.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("🔗 Database API response:", result);
            
            if (result.status === 'success' && Array.isArray(result.data)) {
                // Store the fetched data in localStorage for offline access
                localStorage.setItem('products', JSON.stringify(result.data));
                console.log("✅ Products data synced from database and cached locally");
                return result.data;
            } else {
                throw new Error('Invalid response format from products API');
            }
            
        } catch (error) {
            console.error("❌ Error fetching products from database:", error);
            
            // Try to use cached data from localStorage as fallback
            const cachedProducts = JSON.parse(localStorage.getItem('products') || '[]');
            if (cachedProducts.length > 0) {
                console.log("📱 Using cached product data as fallback");
                return cachedProducts;
            }
            
            throw error; // Re-throw if no cached data available
        }
    }// Function to initialize demo inventory data for testing
    function initializeDemoInventoryData() {
        console.log("=== INITIALIZING DEMO INVENTORY DATA ===");
          const demoProducts = [
            // Hot Coffee
            { name: "Espresso", status: "active", category: "Hot Coffee", price: 120.00, stock_quantity: 15, low_stock_threshold: 5 },
            { name: "Cappuccino", status: "active", category: "Hot Coffee", price: 150.00, stock_quantity: 12, low_stock_threshold: 3 },
            { name: "Americano", status: "active", category: "Hot Coffee", price: 130.00, stock_quantity: 20, low_stock_threshold: 5 },
            { name: "Latte", status: "active", category: "Hot Coffee", price: 140.00, stock_quantity: 8, low_stock_threshold: 2 },
            { name: "Macha", status: "active", category: "Hot Coffee", price: 145.00, stock_quantity: 5, low_stock_threshold: 2 },
            
            // Cold Coffee
            { name: "Iced Latte", status: "active", category: "Cold Coffee", price: 140.00, stock_quantity: 10, low_stock_threshold: 3 },
            { name: "Iced Americano", status: "active", category: "Cold Coffee", price: 130.00, stock_quantity: 25, low_stock_threshold: 5 },
            { name: "Cold Brew", status: "active", category: "Cold Coffee", price: 140.00, stock_quantity: 18, low_stock_threshold: 4 },
            { name: "Frappuccino", status: "active", category: "Cold Coffee", price: 160.00, stock_quantity: 3, low_stock_threshold: 1 },
            { name: "Affogato", status: "active", category: "Cold Coffee", price: 155.00, stock_quantity: 7, low_stock_threshold: 2 },
            
            // Non Coffee (refreshers/sodas)
            { name: "Strawberry Italian Soda", status: "active", category: "Non Coffee", price: 120.00, stock_quantity: 15, low_stock_threshold: 5 },
            { name: "Lemon-Lime Fizz", status: "active", category: "Non Coffee", price: 110.00, stock_quantity: 30, low_stock_threshold: 8 },
            { name: "Raspberry Spritzer", status: "active", category: "Non Coffee", price: 115.00, stock_quantity: 22, low_stock_threshold: 6 },
            { name: "Cucumber Mint Cooler", status: "active", category: "Non Coffee", price: 125.00, stock_quantity: 12, low_stock_threshold: 4 },
            { name: "Blueberry Basil Soda", status: "active", category: "Non Coffee", price: 120.00, stock_quantity: 16, low_stock_threshold: 4 },
            
            // Pastries
            { name: "Donut", status: "active", category: "Pastry", price: 80.00, stock_quantity: 2, low_stock_threshold: 1 },
            { name: "Apple Pie", status: "active", category: "Pastry", price: 90.00, stock_quantity: 4, low_stock_threshold: 1 },
            { name: "Cinnamon Roll", status: "active", category: "Pastry", price: 70.00, stock_quantity: 6, low_stock_threshold: 2 },
            { name: "Sugar Cookie", status: "active", category: "Pastry", price: 60.00, stock_quantity: 10, low_stock_threshold: 3 },
            { name: "Brownie", status: "active", category: "Pastry", price: 75.00, stock_quantity: 8, low_stock_threshold: 2 },
            
            // Sandwiches
            { name: "BLT (Bacon, Lettuce, Tomato)", status: "active", category: "Sandwich", price: 180.00, stock_quantity: 5, low_stock_threshold: 1 },
            { name: "Club Sandwich", status: "active", category: "Sandwich", price: 200.00, stock_quantity: 3, low_stock_threshold: 1 },
            { name: "Grilled Cheese", status: "active", category: "Sandwich", price: 120.00, stock_quantity: 12, low_stock_threshold: 3 },
            { name: "Ham and Swiss", status: "active", category: "Sandwich", price: 160.00, stock_quantity: 7, low_stock_threshold: 2 },
            { name: "Turkey Avocado", status: "active", category: "Sandwich", price: 190.00, stock_quantity: 4, low_stock_threshold: 1 },
            
            // Cakes - ONLY these two should be out of stock
            { name: "Chocolate Cake", status: "active", category: "Cake", price: 200.00, stock_quantity: 2, low_stock_threshold: 1 },
            { name: "Cheesecake", status: "active", category: "Cake", price: 220.00, stock_quantity: 1, low_stock_threshold: 1 },
            { name: "Carrot Cake", status: "active", category: "Cake", price: 190.00, stock_quantity: 3, low_stock_threshold: 1 },
            { name: "Black Forest Cake", status: "inactive", category: "Cake", price: 210.00, stock_quantity: 0, low_stock_threshold: 1 }, // OUT OF STOCK
            { name: "Red Velvet Cake", status: "inactive", category: "Cake", price: 215.00, stock_quantity: 0, low_stock_threshold: 1 } // OUT OF STOCK
        ];
        
        console.log(`📝 Creating ${demoProducts.length} demo products:`);
        demoProducts.forEach(product => {
            console.log(`   - ${product.name}: ${product.status}`);
        });
        
        // Store demo products in localStorage
        localStorage.setItem('products', JSON.stringify(demoProducts));
        console.log("✅ Demo inventory data stored in localStorage");
        
        // Update availability after initialization
        setTimeout(() => {
            console.log("🔄 Running updateProductAvailability after demo data initialization");
            updateProductAvailability();
        }, 100);
        
        console.log("=== DEMO INVENTORY INITIALIZATION COMPLETE ===");
    }    // Call the function to check availability when page loads
    console.log("Initializing product availability system with DATABASE SYNC...");
    
    // Check availability immediately from database
    updateProductAvailability();

    // Check availability every 10 seconds to keep it updated with database changes
    setInterval(updateProductAvailability, 10000); // Reduced from 30 seconds for faster sync

    // Replace the existing food item click handlers
    document.querySelectorAll('.food-item').forEach(item => {
        item.style.cursor = 'pointer';
        
        // Remove any existing click listeners first
        item.replaceWith(item.cloneNode(true));
    });

    // Re-select items after cloning and add new listeners
    document.querySelectorAll('.food-item').forEach(item => {
        item.style.cursor = 'pointer';
        
        item.addEventListener('click', function(e) {
            // Don't handle click if item is out of stock
            if (this.classList.contains('out-of-stock')) {
                e.preventDefault();
                e.stopPropagation();
                const foodName = this.querySelector('.food-name').textContent;
                showOutOfStockNotification(foodName);
                console.log(`🚫 Blocked click on out-of-stock item: ${foodName}`);
                return false;
            }
            
            // Don't handle click if clicking quantity buttons
            if (e.target.closest('.quantity-scaler')) {
                return;
            }
            
            const foodName = this.querySelector('.food-name').textContent;
            const foodPrice = parseFloat(this.querySelector('.food-price').textContent.replace('₱', ''));
            const category = getDrinkCategory(this, foodName);
            
            console.log(`Clicked item: ${foodName}, Category: ${category}, Price: ${foodPrice}`);
            
            // Show add-ons modal only for hot and cold coffee
            if (category === 'hot-coffee' || category === 'cold-coffee') {
                showAddonsModal(foodName, foodPrice, this);
            } else {
                // For snacks and non-coffee drinks, add directly without add-ons
                addItemDirectly(foodName, foodPrice);
            }
        });
    });

    // Function to determine drink category
    function getDrinkCategory(item, foodName) {
        // Check if item is in coffee grid
        if (item.closest('.coffee-grid')) {
            // Determine if it's hot, cold, or non-coffee based on the section
            const gridHeadings = document.querySelectorAll('.coffee-grid .grid-heading');
            let currentCategory = 'hot-coffee'; // default
            
            for (let heading of gridHeadings) {
                const headingText = heading.textContent.toLowerCase();
                const itemElement = item;
                
                // Check if this item comes after a specific heading
                let currentElement = heading.nextElementSibling;
                while (currentElement && !currentElement.classList.contains('grid-heading')) {
                    if (currentElement === itemElement) {
                        if (headingText.includes('cold')) {
                            return 'cold-coffee';
                        } else if (headingText.includes('hot')) {
                            return 'hot-coffee';
                        } else if (headingText.includes('non')) {
                            return 'non-coffee';
                        }
                        break;
                    }
                    currentElement = currentElement.nextElementSibling;
                }
            }
            
            // Additional check based on item name for more accuracy
            const itemNameLower = foodName.toLowerCase();
            if (itemNameLower.includes('iced') || itemNameLower.includes('cold') || itemNameLower.includes('frappuccino') || itemNameLower.includes('affogato')) {
                return 'cold-coffee';
            } else if (itemNameLower.includes('italian soda') || itemNameLower.includes('fizz') || itemNameLower.includes('spritzer') || itemNameLower.includes('cooler') || itemNameLower.includes('basil soda')) {
                return 'non-coffee';
            }
            
            return currentCategory;
        } else {
            // Items in snacks grid are non-coffee
            return 'snacks';
        }
    }

    // Function to show add-ons modal
    function showAddonsModal(itemName, itemPrice, itemElement) {
        console.log(`Showing addons modal for: ${itemName}`);
        const modal = document.getElementById('addonsModal');
        const itemNameSpan = modal.querySelector('.addon-item-name');
        
        if (!modal || !itemNameSpan) {
            console.error('Addons modal elements not found');
            return;
        }
        
        // Reset all checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Set item name in modal
        itemNameSpan.textContent = itemName;
        modal.style.display = 'flex';
        
        // Store current item data for later use
        modal.setAttribute('data-item-name', itemName);
        modal.setAttribute('data-item-price', itemPrice);
        
        console.log('Modal displayed successfully');
    }    // Function to add item directly (for snacks)
    async function addItemDirectly(itemName, itemPrice) {
        console.log(`Adding item directly: ${itemName}`);
        
        // Check stock limit before adding
        const currentQuantityInOrder = storedOrderItems
            .filter(item => item.name === itemName)
            .reduce((sum, item) => sum + item.quantity, 0);
        
        const stockLimit = await getProductStockLimit(itemName);
        console.log(`📊 Stock limit for "${itemName}": ${stockLimit}, current in order: ${currentQuantityInOrder}`);
        
        if (stockLimit !== null && (currentQuantityInOrder + 1) > stockLimit) {
            console.log(`🚫 Cannot add "${itemName}" - would exceed stock limit (${currentQuantityInOrder + 1} > ${stockLimit})`);
            showStockLimitNotification(itemName, stockLimit);
            return; // Don't add if it would exceed stock limit
        }
        
        const orderItem = {
            name: itemName,
            price: itemPrice,
            quantity: 1,
            addons: [],
            total: itemPrice
        };
        
        storedOrderItems.push(orderItem);
        localStorage.setItem('storedOrderItems', JSON.stringify(storedOrderItems));
        console.log(`✅ Added "${itemName}" to order successfully`);
        showSuccessNotification(`Added ${itemName} to order`);
    }

    // Handle add-ons modal buttons
    const addonsModal = document.getElementById('addonsModal');
    
    if (addonsModal) {
        // Close modal button
        const closeBtn = addonsModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                addonsModal.style.display = 'none';
            });
        }
        
        // Cancel button
        const cancelBtn = addonsModal.querySelector('.cancel-modal-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                addonsModal.style.display = 'none';
            });
        }
          // Add to order button
        const addBtn = addonsModal.querySelector('.add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                const itemName = addonsModal.getAttribute('data-item-name');
                const itemPrice = parseFloat(addonsModal.getAttribute('data-item-price'));
                
                // Check stock limit before adding
                const currentQuantityInOrder = storedOrderItems
                    .filter(item => item.name === itemName)
                    .reduce((sum, item) => sum + item.quantity, 0);
                
                const stockLimit = await getProductStockLimit(itemName);
                console.log(`📊 MODAL: Stock limit for "${itemName}": ${stockLimit}, current in order: ${currentQuantityInOrder}`);
                
                if (stockLimit !== null && (currentQuantityInOrder + 1) > stockLimit) {
                    console.log(`🚫 MODAL: Cannot add "${itemName}" - would exceed stock limit (${currentQuantityInOrder + 1} > ${stockLimit})`);
                    showStockLimitNotification(itemName, stockLimit);
                    return; // Don't add if it would exceed stock limit
                }
                
                // Get selected add-ons (no need to exclude "No Add-ons" since it's removed)
                const selectedAddons = [...addonsModal.querySelectorAll('input[type="checkbox"]:checked')].map(cb => ({
                    name: cb.getAttribute('data-name'),
                    price: parseFloat(cb.getAttribute('data-price'))
                }));
                
                // Calculate total price including add-ons
                const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
                const totalPrice = itemPrice + addonTotal;
                
                // Create order item
                const orderItem = {
                    name: itemName,
                    price: itemPrice,
                    quantity: 1,
                    addons: selectedAddons,
                    total: totalPrice
                };
                
                // Add to stored items
                storedOrderItems.push(orderItem);
                localStorage.setItem('storedOrderItems', JSON.stringify(storedOrderItems));
                
                // Close modal and show success
                addonsModal.style.display = 'none';
                
                console.log(`✅ MODAL: Added "${itemName}" with ${selectedAddons.length} add-ons to order successfully`);
                
                // Create appropriate success message
                let successMessage;
                if (selectedAddons.length === 0) {
                    successMessage = `Added ${itemName} (no add-ons) to order`;
                } else {
                    const addonText = selectedAddons.length > 1 ? 's' : '';
                    successMessage = `Added ${itemName} with ${selectedAddons.length} add-on${addonText} to order`;
                }
                
                showSuccessNotification(successMessage);
            });
        }
        
        // Close modal when clicking outside
        addonsModal.addEventListener('click', (e) => {
            if (e.target === addonsModal) {
                addonsModal.style.display = 'none';
            }
        });
    }

    // Remove old conflicting handlers and update View Order functionality
    document.querySelector('.view-button').addEventListener('click', () => {
        console.log("View order button clicked");
        
        // Get stored items only (new modal-based flow)
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        console.log('Current stored items:', currentStoredItems);
        
        if (currentStoredItems.length === 0) {
            console.log("No items found, showing empty order modal");
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check order type
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Populate and show view order modal
        populateViewOrderModal(currentStoredItems);
        document.getElementById('viewOrderModal').style.display = 'flex';
    });

    // Function to populate view order modal with stored items
    function populateViewOrderModal(orderItems) {
        const orderTypeDisplay = document.querySelector('.order-type-display');
        const orderItemsContainer = document.querySelector('.order-items');
        const orderTotalContainer = document.querySelector('.order-total');
        
        // Clear previous content
        orderItemsContainer.innerHTML = '';
        
        // Display order type
        const activeOrderType = document.querySelector('.order-button.active');
        if (activeOrderType && orderTypeDisplay) {
            orderTypeDisplay.textContent = `Order Type: ${activeOrderType.textContent.trim()}`;
        }
        
        // Group items by name and add-ons
        const groupedItems = {};
        
        orderItems.forEach((item, originalIndex) => {
            // Create a unique key based on item name and add-ons
            const addonsKey = item.addons.map(addon => `${addon.name}:${addon.price}`).sort().join('|');
            const itemKey = `${item.name}::${addonsKey}`;
            
            if (groupedItems[itemKey]) {
                // Item with same name and add-ons exists, increase quantity
                groupedItems[itemKey].quantity += item.quantity;
                groupedItems[itemKey].originalIndexes.push(originalIndex);
            } else {
                // New item
                groupedItems[itemKey] = {
                    ...item,
                    originalIndexes: [originalIndex]
                };
            }
        });
        
        // Calculate accurate total and build items HTML
        let grandTotal = 0;
        let itemsHtml = '<ul class="order-item-list" style="list-style: none; padding: 0; margin: 0;">';
        
        Object.values(groupedItems).forEach((item, index) => {
            let addonHtml = '';
            
            if (item.addons && item.addons.length > 0) {
                addonHtml = '<div class="item-addons" style="margin-left: 15px; margin-top: 8px; background-color: #f9f9f9; padding: 8px; border-radius: 4px;">';
                item.addons.forEach(addon => {
                    addonHtml += `
                        <div class="addon-item" style="display: flex; justify-content: space-between; font-size: 0.9em; color: #666;">
                            <span>+ ${addon.name}</span>
                            <span>₱${addon.price.toFixed(2)}</span>
                        </div>
                    `;
                });
                addonHtml += '</div>';
            }
            
            // Calculate accurate item total: (base price + addon prices) * quantity
            const basePrice = parseFloat(item.price) || 0;
            const addonTotal = item.addons.reduce((sum, addon) => sum + (parseFloat(addon.price) || 0), 0);
            const itemUnitPrice = basePrice + addonTotal;
            const itemTotalPrice = itemUnitPrice * item.quantity;
            
            // Add to grand total
            grandTotal += itemTotalPrice;
            
            // Store original indexes as data attribute for removal
            const originalIndexesStr = item.originalIndexes.join(',');
            
            itemsHtml += `
                <li class="order-item" data-original-indexes="${originalIndexesStr}" data-item-key="${index}" style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); pointer-events: none;">
                    <div class="item-main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="quantity-controls" style="display: flex; align-items: center; background: #f5f5f5; border-radius: 5px; padding: 2px; pointer-events: auto;">
                                <button class="qty-minus" data-item-key="${index}" style="background: #4A2C1B; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                                <input type="number" class="qty-input" data-item-key="${index}" value="${item.quantity}" min="1" style="width: 50px; text-align: center; border: none; background: transparent; font-weight: bold; color: #4A2C1B; margin: 0 5px; -webkit-appearance: none; -moz-appearance: textfield; appearance: none;">
                                <button class="qty-plus" data-item-key="${index}" style="background: #4A2C1B; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                            </div>
                            <span class="item-name" style="font-weight: bold; color: #4A2C1B;">${item.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; pointer-events: auto;">
                            <span class="item-price" style="color: #666;">₱${basePrice.toFixed(2)} each</span>
                            <button class="remove-item-btn" data-item-key="${index}" style="background: #f44336; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Remove item">×</button>
                        </div>
                    </div>
                    ${addonHtml}
                    <div class="item-total" style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc; font-weight: bold; color: #4A2C1B;">
                        <span>Subtotal:</span>
                        <span class="subtotal-amount">₱${itemTotalPrice.toFixed(2)}</span>
                    </div>
                </li>
            `;
        });
        
        itemsHtml += '</ul>';
        orderItemsContainer.innerHTML = itemsHtml;

        // Add CSS to hide spinner arrows for webkit browsers
        const style = document.createElement('style');
        style.textContent = `
            .qty-input::-webkit-outer-spin-button,
            .qty-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .qty-input[type=number] {
                -moz-appearance: textfield;
            }
        `;
        if (!document.head.querySelector('style[data-qty-arrows]')) {
            style.setAttribute('data-qty-arrows', 'true');
            document.head.appendChild(style);
        }
        
        if (orderTotalContainer) {
            orderTotalContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #4A2C1B; padding: 15px 0; border-top: 2px solid #4A2C1B;">
                    <span>Total Amount:</span>
                    <span class="total-amount">₱${grandTotal.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Add event listeners for quantity controls
        addQuantityControlListeners(groupedItems);
        
        // Add click handlers ONLY for remove buttons - Use event delegation to prevent conflicts
        const orderItemsList = orderItemsContainer.querySelector('.order-item-list');
        if (orderItemsList) {
            orderItemsList.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-item-btn')) {
                    e.stopPropagation();
                    const itemKey = parseInt(e.target.getAttribute('data-item-key'));
                    const groupedItemsArray = Object.values(groupedItems);
                    const originalIndexes = groupedItemsArray[itemKey].originalIndexes;
                    showRemoveConfirmationForGroup(originalIndexes);
                }
            });
        }
    }    // Function to add quantity control listeners with stock limit checking
    function addQuantityControlListeners(groupedItems) {
        const groupedItemsArray = Object.values(groupedItems);
        
        // Plus button listeners with stock limit checking
        document.querySelectorAll('.qty-plus').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                const item = groupedItemsArray[itemKey];
                const qtyInput = document.querySelector(`.qty-input[data-item-key="${itemKey}"]`);
                let currentQty = parseInt(qtyInput.value);
                const newQty = currentQty + 1;
                
                console.log(`🔍 MODAL: Checking stock limit for ${item.name} - Current qty: ${currentQty}, Requested qty: ${newQty}`);
                
                // Get stock limit for this item
                const stockLimit = await getProductStockLimit(item.name);
                console.log(`📊 MODAL: Stock limit for ${item.name}: ${stockLimit}`);
                
                if (stockLimit !== null && newQty > stockLimit) {
                    console.log(`🚫 MODAL: Stock limit exceeded for ${item.name}. Max: ${stockLimit}, Requested: ${newQty}`);
                    showStockLimitNotification(item.name, stockLimit);
                    return;
                }
                
                console.log(`✅ MODAL: Stock limit check passed for ${item.name}`);
                qtyInput.value = newQty;
                updateItemQuantity(itemKey, newQty, groupedItemsArray);
            });
        });
        
        // Minus button listeners
        document.querySelectorAll('.qty-minus').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                const qtyInput = document.querySelector(`.qty-input[data-item-key="${itemKey}"]`);
                let currentQty = parseInt(qtyInput.value);
                if (currentQty > 1) {
                    currentQty--;
                    qtyInput.value = currentQty;
                    updateItemQuantity(itemKey, currentQty, groupedItemsArray);
                }
            });
        });
        
        // Input field listeners with stock limit checking
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', async function(e) {
                e.stopPropagation();
                const itemKey = parseInt(this.getAttribute('data-item-key'));
                const item = groupedItemsArray[itemKey];
                let newQty = parseInt(this.value);
                const originalQty = parseInt(this.getAttribute('data-original-value') || this.defaultValue || 1);
                
                if (isNaN(newQty) || newQty < 1) {
                    newQty = 1;
                    this.value = 1;
                }
                
                console.log(`🔍 MODAL INPUT: Checking stock limit for ${item.name} - Input qty: ${newQty}`);
                
                // Get stock limit for this item
                const stockLimit = await getProductStockLimit(item.name);
                console.log(`📊 MODAL INPUT: Stock limit for ${item.name}: ${stockLimit}`);
                
                if (stockLimit !== null && newQty > stockLimit) {
                    console.log(`🚫 MODAL INPUT: Stock limit exceeded for ${item.name}. Max: ${stockLimit}, Requested: ${newQty}`);
                    showStockLimitNotification(item.name, stockLimit);
                    // Restore previous valid value
                    this.value = Math.min(originalQty, stockLimit);
                    return;
                }
                
                console.log(`✅ MODAL INPUT: Stock limit check passed for ${item.name}`);
                updateItemQuantity(itemKey, newQty, groupedItemsArray);
            });
            
            // Store original value for rollback
            input.addEventListener('focus', function(e) {
                this.setAttribute('data-original-value', this.value);
            });
            
            // Prevent form submission on Enter key
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        });
    }// Function to update item quantity
    function updateItemQuantity(itemKey, newQuantity, groupedItemsArray) {
        const item = groupedItemsArray[itemKey];
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        // Remove all existing instances of this item
        const indexesToRemove = item.originalIndexes.sort((a, b) => b - a);
        indexesToRemove.forEach(index => {
            if (index < currentStoredItems.length) {
                currentStoredItems.splice(index, 1);
            }
        });
        
        // Add back a single consolidated item with the correct quantity
        if (newQuantity > 0) {
            const consolidatedItem = {
                name: item.name,
                price: item.price,
                quantity: newQuantity,
                addons: [...item.addons],
                total: (item.price + item.addons.reduce((sum, addon) => sum + addon.price, 0)) * newQuantity
            };
            currentStoredItems.push(consolidatedItem);
        }
        
        // Update localStorage
        localStorage.setItem('storedOrderItems', JSON.stringify(currentStoredItems));
        storedOrderItems = currentStoredItems;
        
        // Update the display
        updateItemDisplay(itemKey, item, newQuantity);
        updateTotalDisplay();
    }

    // Function to update item display
    function updateItemDisplay(itemKey, item, newQuantity) {
        const orderItem = document.querySelector(`.order-item[data-item-key="${itemKey}"]`);
        if (orderItem) {
            // Calculate accurate subtotal: (base price + addon prices) * quantity
            const basePrice = parseFloat(item.price) || 0;
            const addonTotal = item.addons.reduce((sum, addon) => sum + (parseFloat(addon.price) || 0), 0);
            const unitPrice = basePrice + addonTotal;
            const newSubtotal = unitPrice * newQuantity;
            
            const subtotalElement = orderItem.querySelector('.subtotal-amount');
            if (subtotalElement) {
                subtotalElement.textContent = `₱${newSubtotal.toFixed(2)}`;
            }
        }
    }

    // Function to update total display
    function updateTotalDisplay() {
        // Recalculate total from all visible items in the modal
        let grandTotal = 0;
        
        // Get all visible order items and calculate their totals
        document.querySelectorAll('.order-item').forEach(orderItem => {
            const subtotalElement = orderItem.querySelector('.subtotal-amount');
            if (subtotalElement) {
                const subtotalText = subtotalElement.textContent.replace('₱', '').replace(',', '');
                const subtotal = parseFloat(subtotalText) || 0;
                grandTotal += subtotal;
            }
        });
        
        const totalElement = document.querySelector('.total-amount');
        if (totalElement) {
            totalElement.textContent = `₱${grandTotal.toFixed(2)}`;
        }
    }    // Modal control buttons - Fix the order confirmation flow
    document.querySelector('.confirm-modal-btn').addEventListener('click', async () => {
        // Get the current stored items
        const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        if (currentStoredItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
            return;
        }
        
        // Check if order type is selected
        const orderType = document.querySelector('.order-button.active');
        if (!orderType) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('orderTypeModal').style.display = 'flex';
            return;
        }
        
        // Disable confirm button to prevent double submission
        const confirmBtn = document.querySelector('.confirm-modal-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        
        try {
            // Submit order to database
            const orderData = await submitOrderToDatabase(currentStoredItems, orderType.textContent.trim());
            
            if (orderData.success) {
                // Clear stored items after successful submission
                localStorage.removeItem('storedOrderItems');
                storedOrderItems = [];
                
                // Save order data to localStorage
                localStorage.setItem('orderType', orderType.textContent);
                localStorage.setItem('lastOrderNumber', orderData.order_number);
                
                // Update order number in Thank You Modal
                document.getElementById('orderNumber').textContent = orderData.order_number;
                
                // Close the view order modal and show the thank you modal
                document.getElementById('viewOrderModal').style.display = 'none';
                document.getElementById('thankYouModal').style.display = 'flex';
                
                console.log('Order submitted successfully:', orderData);
            } else {
                throw new Error(orderData.message || 'Failed to submit order');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order: ' + error.message + '\nPlease try again.');
        } finally {
            // Re-enable confirm button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Order';
        }
    });    // Function to submit order to database
    async function submitOrderToDatabase(orderItems, orderType) {
        try {
            console.log('🔄 Starting order submission process...');
            console.log('Order items received:', orderItems);
            
            // Step 1: Fetch all products from database to get product IDs
            const productsResponse = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/products.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!productsResponse.ok) {
                throw new Error(`Failed to fetch products: ${productsResponse.status}`);
            }
            
            const productsResult = await productsResponse.json();
            console.log('📦 Products API response:', productsResult);
            
            if (productsResult.status !== 'success' || !Array.isArray(productsResult.data)) {
                throw new Error('Invalid products API response');
            }
            
            const products = productsResult.data;
            
            // Step 2: Create a mapping of product names to IDs
            const productMap = {};
            products.forEach(product => {
                const nameKey = product.name.toLowerCase().trim();
                productMap[nameKey] = {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price)
                };
                console.log(`📋 Mapped: "${nameKey}" -> ID: ${product.id}`);
            });
            
            console.log('🗺️ Product mapping created:', productMap);
            
            // Step 3: Map order items to include product IDs
            const mappedItems = [];
            for (const item of orderItems) {
                const itemNameKey = item.name.toLowerCase().trim();
                const product = productMap[itemNameKey];
                
                if (!product) {
                    console.error(`❌ Product not found in database: "${item.name}" (key: "${itemNameKey}")`);
                    console.log('Available products:', Object.keys(productMap));
                    throw new Error(`Product "${item.name}" not found in database`);
                }
                
                const mappedItem = {
                    product_name: product.name, // Use exact name from database
                    product_id: product.id,     // Include resolved product ID
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.total,
                    addons: item.addons || []
                };
                
                mappedItems.push(mappedItem);
                console.log(`✅ Mapped item: "${item.name}" -> ID: ${product.id}, Price: ₱${item.price}`);
            }
            
            // Step 4: Prepare order data for backend
            const orderData = {
                order_type: orderType.toLowerCase(),
                customer_name: null, // Can be extended later to capture customer name
                items: mappedItems
            };

            console.log('📤 Submitting order to database:', orderData);

            // Step 5: Submit to backend API
            const response = await fetch('http://localhost/SOURCE_CODE/Employee/public/api/orders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('📥 Backend response:', result);
            
            if (result.status === 'success') {
                console.log('✅ Order submitted successfully!');
                return {
                    success: true,
                    order_number: result.data.order_number,
                    order_id: result.data.id,
                    total_amount: result.data.total_amount
                };
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
            
        } catch (error) {
            console.error('❌ Error submitting order to database:', error);
            throw error;
        }
    }

    // Add missing functions for handling modals
    function updateOrderSummary() {
        // This function should return the current stored items
        return JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
    }

    function getCurrentQuantityItems() {
        // This function gets items from the quantity-based interface (old system)
        // Since we're using the new modal-based system, this should return empty array
        return [];
    }

    function populateOrderModalWithAllItems(orderItems) {
        // Use the existing populateViewOrderModal function
        populateViewOrderModal(orderItems);
    }

    // Add modal handlers for closing modals
    document.addEventListener('click', function(e) {
        // Handle order type modal option buttons
        if (e.target.classList.contains('option-btn')) {
            const orderType = e.target.getAttribute('data-type');
            
            // Set the order type
            document.querySelectorAll('.order-button').forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#e0e0e0';
            });
            
            document.querySelectorAll('.order-button').forEach(btn => {
                if (btn.textContent.trim() === orderType) {
                    btn.classList.add('active');
                    btn.style.backgroundColor = '#ffffff';
                }
            });
            
            // Close the modal
            document.getElementById('orderTypeModal').style.display = 'none';
            
            // Show view order modal if we have items
            const currentStoredItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
            if (currentStoredItems.length > 0) {
                populateViewOrderModal(currentStoredItems);
                document.getElementById('viewOrderModal').style.display = 'flex';
            }
        }
        
        // Handle empty order modal close button
        if (e.target.classList.contains('notification-ok-btn')) {
            const modal = e.target.closest('.notification-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle all X close buttons (close-modal and close-notification-modal)
        if (e.target.classList.contains('close-modal') || e.target.classList.contains('close-notification-modal')) {
            // Find the closest modal container
            let modal = e.target.closest('.notification-modal') || 
                       e.target.closest('.view-order-modal') || 
                       e.target.closest('.addons-modal') || 
                       e.target.closest('.thank-you-modal');
            
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle all cancel buttons in modals
        if (e.target.classList.contains('cancel-modal-btn')) {
            // Find the closest modal container
            let modal = e.target.closest('.notification-modal') || 
                       e.target.closest('.view-order-modal') || 
                       e.target.closest('.addons-modal') || 
                       e.target.closest('.thank-you-modal');
            
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Handle modal overlay clicks (clicking outside modal content)
        if (e.target.classList.contains('notification-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('view-order-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('addons-modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('thank-you-modal')) {
            e.target.style.display = 'none';
        }
    });

    // Remove the duplicate view order button handler that was causing conflicts
    // (The one that starts with "document.querySelector('.view-button').addEventListener('click', () => {")
    // Keep only the first one we defined above

    // Function to show remove confirmation for grouped items
    function showRemoveConfirmationForGroup(originalIndexes) {
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmationMessage = document.getElementById('confirmationMessage');
        const currentItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        if (originalIndexes.length > 0 && currentItems[originalIndexes[0]]) {
            const itemName = currentItems[originalIndexes[0]].name;
            const quantity = originalIndexes.length;
            
            if (quantity === 1) {
                confirmationMessage.textContent = `Are you sure you want to remove "${itemName}" from your order?`;
            } else {
                confirmationMessage.textContent = `Are you sure you want to remove all ${quantity} "${itemName}" items from your order?`;
            }
            
            confirmationModal.style.display = 'flex';
            
            document.getElementById('confirmYes').onclick = function() {
                removeGroupedItemsFromOrder(originalIndexes);
                confirmationModal.style.display = 'none';
            };
            
            document.getElementById('confirmCancel').onclick = function() {
                confirmationModal.style.display = 'none';
            };
        }
    }

    // Function to remove grouped items from order
    function removeGroupedItemsFromOrder(originalIndexes) {
        let currentItems = JSON.parse(localStorage.getItem('storedOrderItems') || '[]');
        
        // Sort indexes in descending order to remove from the end first
        originalIndexes.sort((a, b) => b - a);
        
        // Remove items by their original indexes
        originalIndexes.forEach(index => {
            if (index < currentItems.length) {
                currentItems.splice(index, 1);
            }
        });
        
        localStorage.setItem('storedOrderItems', JSON.stringify(currentItems));
        storedOrderItems = currentItems;
        
        if (currentItems.length === 0) {
            document.getElementById('viewOrderModal').style.display = 'none';
            document.getElementById('emptyOrderModal').style.display = 'flex';
        } else {
            populateViewOrderModal(currentItems);
        }
    }

    // Handle Thank You Modal close button - Update to go back to welcome screen
    document.querySelector('.close-thank-you-btn').addEventListener('click', function() {
        console.log("Thank you modal close button clicked");
        
        // Check if we're already showing the success message
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // If success message is already showing (receipt printed), go directly to welcome page
        if (loadingSpinner.innerHTML.includes('Receipt printed successfully')) {
            window.location.href = 'welcomeinterface.html';
            return;
        }
        
        // Otherwise, start the printing process
        loadingSpinner.classList.add('active');
        
        // Disable the OK button to prevent multiple clicks during printing
        this.disabled = true;
        
        // Clear the order data from localStorage
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        
        // Add a delay to simulate printing the receipt (3 seconds)
        setTimeout(() => {
            // Show a success message instead of the spinner
            loadingSpinner.innerHTML = '<p class="success-message" style="font-size: 18px; color: #388e3c; font-weight: bold;">✓ Receipt printed successfully!</p><p>Please proceed to the cashier.</p>';
            
            // Re-enable the OK button so it can be clicked to immediately go to welcome page
            document.querySelector('.close-thank-you-btn').disabled = false;
            document.querySelector('.close-thank-you-btn').textContent = 'Return to Home';
            
            // Still add a fallback automatic redirect after 8 seconds in case user doesn't click
            setTimeout(() => {
                window.location.href = 'welcomeinterface.html';
            }, 8000);
        }, 3000);
    });

    // Cancel order button - Navigate to welcome interface
    document.querySelector('.cancel-button').addEventListener('click', () => {
        console.log("Cancel order button clicked");
        
        // Clear all stored order data completely
        localStorage.removeItem('storedOrderItems');
        localStorage.removeItem('orderItems');
        localStorage.removeItem('orderType');
        localStorage.removeItem('pendingOrderType');
        localStorage.removeItem('lastOrderNumber');
        
        // Reset the storedOrderItems variable
        storedOrderItems = [];
        
        // Clear all visual selections and reset quantities
        document.querySelectorAll('.selected').forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('in-order');
        });
        
        // Reset all quantity values to 0
        document.querySelectorAll('.quantity-value').forEach(qtyElement => {
            qtyElement.textContent = '0';
        });
        
        // Disable all minus buttons
        document.querySelectorAll('.minus').forEach(minusBtn => {
            minusBtn.disabled = true;
        });
        
        // Reset order type buttons
        document.querySelectorAll('.order-button').forEach(btn => {
            btn.classList.remove('active');
            btn.style.backgroundColor = '#e0e0e0';
        });
        
        console.log("All order data cleared successfully");
        
        // Navigate to welcome interface
        window.location.href = 'welcomeinterface.html';
    });

    // Initialize quantities and handle quantity changes
    document.querySelectorAll('.food-item').forEach(item => {
        const quantityValue = item.querySelector('.quantity-value');
        const minusBtn = item.querySelector('.minus');
        if (quantityValue) quantityValue.textContent = '0';
        if (minusBtn) minusBtn.disabled = true;
    });

    document.querySelectorAll('.quantity-scaler').forEach(scaler => {
        const minusBtn = scaler.querySelector('.minus');
        const plusBtn = scaler.querySelector('.plus');
        const valueSpan = scaler.querySelector('.quantity-value');
        const foodItem = scaler.closest('.food-item');

        if (minusBtn && plusBtn && valueSpan && foodItem) {
            minusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let value = parseInt(valueSpan.textContent);
                if (value > 0) {
                    value--;
                    valueSpan.textContent = value;
                    minusBtn.disabled = value === 0;
                    if (value === 0) {
                        foodItem.classList.remove('selected');
                        foodItem.classList.remove('in-order');
                    }
                    // Re-enable plus button if quantity is now below stock limit
                    const foodName = foodItem.querySelector('.food-name').textContent.trim();
                    getProductStockLimit(foodName).then(stockLimit => {
                        if (stockLimit !== null && value < stockLimit) {
                            scaler.querySelector('.plus').disabled = false;
                        }
                    });                    updateOrderSummary();
                }
            });
              plusBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                let value = parseInt(valueSpan.textContent);
                
                // Check stock limit before incrementing
                const foodName = foodItem.querySelector('.food-name').textContent.trim();
                console.log(`➕ Plus button clicked for "${foodName}", current quantity: ${value}`);
                
                const stockLimit = await getProductStockLimit(foodName);
                console.log(`📊 Stock limit for "${foodName}": ${stockLimit}`);
                
                if (stockLimit !== null && value >= stockLimit) {
                    console.log(`🚫 Cannot increment "${foodName}" - stock limit reached (${value} >= ${stockLimit})`);
                    showStockLimitNotification(foodName, stockLimit);
                    plusBtn.disabled = true;
                    return; // Don't increment if at stock limit
                }
                
                // Increment value
                value++;
                console.log(`✅ Incrementing "${foodName}" to ${value}`);
                valueSpan.textContent = value;
                minusBtn.disabled = false;
                foodItem.classList.add('selected');
                foodItem.classList.add('in-order');
                updateOrderSummary();
                
                // Disable plus if now at stock limit
                if (stockLimit !== null && value >= stockLimit) {
                    console.log(`🔒 Disabling plus button for "${foodName}" - stock limit reached (${value} >= ${stockLimit})`);
                    plusBtn.disabled = true;
                } else {
                    plusBtn.disabled = false;
                }
            });
        }
    });    // Helper: Get product stock limit by name (from localStorage cache)
    async function getProductStockLimit(productName) {
        console.log(`🔍 Getting stock limit for: "${productName}"`);
        
        // Try to get from localStorage cache (synced every 10s)
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const product = products.find(p => p.name && p.name.toLowerCase() === productName.toLowerCase());
        
        if (product && typeof product.stock_quantity === 'number') {
            console.log(`📦 Found stock limit for "${productName}": ${product.stock_quantity}`);
            return product.stock_quantity;
        }
        
        console.log(`❓ No stock data found in localStorage for "${productName}"`);
        
        // If not found, fallback to fetching from DB (rare)
        try {
            console.log(`🌐 Fetching fresh data from database for "${productName}"`);
            const dbProducts = await fetchProductsFromDatabase();
            const dbProduct = dbProducts.find(p => p.name && p.name.toLowerCase() === productName.toLowerCase());
            if (dbProduct && typeof dbProduct.stock_quantity === 'number') {
                console.log(`📦 Found stock limit from DB for "${productName}": ${dbProduct.stock_quantity}`);
                return dbProduct.stock_quantity;
            }
        } catch (e) {
            console.error(`❌ Error fetching from database for "${productName}":`, e);
            // Ignore fetch error, treat as unlimited
        }
        
        console.log(`⚠️ No stock limit found for "${productName}" - treating as unlimited`);
        return null; // No limit found
    }

    // Helper: Show notification when stock limit is reached
    function showStockLimitNotification(productName, stockLimit) {
        let notification = document.querySelector('.stock-limit-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'stock-limit-notification';
            notification.style.cssText = `
                position: fixed;
                top: 60px;
                right: 20px;
                background: #e53935;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 16px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                display: none;
            `;
            document.body.appendChild(notification);
        }
        notification.textContent = `Cannot add more than ${stockLimit} for ${productName} (stock limit reached)`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2500);
    }

    // Function to show success notification
    function showSuccessNotification(message) {
        let notification = document.querySelector('.success-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 16px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                display: none;
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }    // Function to show out of stock notification
    function showOutOfStockNotification(productName) {
        let notification = document.querySelector('.out-of-stock-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'out-of-stock-notification';
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
                color: white;
                padding: 25px 35px;
                border-radius: 15px;
                z-index: 15000;
                font-size: 18px;
                box-shadow: 
                    0 10px 30px rgba(220, 20, 60, 0.4),
                    0 5px 15px rgba(0, 0, 0, 0.3),
                    inset 0 2px 4px rgba(255, 255, 255, 0.2);
                display: none;
                font-weight: bold;
                text-align: center;
                border: 3px solid rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                animation: outOfStockNotificationPulse 0.5s ease-out;
                max-width: 400px;
                min-width: 320px;
            `;
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div style="font-size: 48px; margin-bottom: 5px;">🚫</div>
                <div>
                    <div style="font-size: 22px; margin-bottom: 8px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">ITEM UNAVAILABLE</div>
                    <div style="font-size: 16px; opacity: 0.95; line-height: 1.4;">"${productName}" is currently out of stock</div>
                    <div style="font-size: 14px; opacity: 0.85; margin-top: 8px; font-style: italic;">Please choose another item</div>
                </div>
            </div>
        `;
        
        // Add CSS animation keyframes if not already present
        if (!document.querySelector('#outOfStockAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'outOfStockAnimationStyles';
            style.textContent = `
                @keyframes outOfStockNotificationPulse {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.8); 
                    }
                    50% { 
                        opacity: 0.8; 
                        transform: translate(-50%, -50%) scale(1.05); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1); 
                    }
                }
                
                @keyframes outOfStockNotificationFadeOut {
                    0% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.9); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.style.display = 'block';
        notification.style.animation = 'outOfStockNotificationPulse 0.5s ease-out';
        
        // Add click-to-dismiss functionality
        const dismissHandler = () => {
            notification.style.animation = 'outOfStockNotificationFadeOut 0.3s ease-in';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
            notification.removeEventListener('click', dismissHandler);
        };
        notification.addEventListener('click', dismissHandler);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (notification.style.display !== 'none') {
                dismissHandler();
            }
        }, 5000);
    }
});