<?php
// Simple test script for auto-deduction functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Database connection
    $pdo = new PDO("mysql:host=localhost;dbname=employee_db;charset=utf8mb4", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "=== AUTO-DEDUCTION TEST ===\n";
    echo "Database connected successfully\n\n";
    
    // 1. Find a product with stock > 0 and active status
    $stmt = $pdo->prepare("SELECT * FROM products WHERE stock_quantity > 0 AND status = 'active' LIMIT 1");
    $stmt->execute();
    $testProduct = $stmt->fetch();
    
    if (!$testProduct) {
        echo "❌ No products with stock > 0 and active status found for testing\n";
        
        // Check all products
        $stmt = $pdo->prepare("SELECT id, name, stock_quantity, status FROM products ORDER BY stock_quantity DESC LIMIT 5");
        $stmt->execute();
        $allProducts = $stmt->fetchAll();
        
        echo "\nCurrent product inventory:\n";
        foreach ($allProducts as $product) {
            echo "ID: {$product['id']} | Name: {$product['name']} | Stock: {$product['stock_quantity']} | Status: {$product['status']}\n";
        }
        exit;
    }
    
    echo "✅ Test Product Found:\n";
    echo "   ID: {$testProduct['id']}\n";
    echo "   Name: {$testProduct['name']}\n";
    echo "   Stock: {$testProduct['stock_quantity']}\n";
    echo "   Status: {$testProduct['status']}\n\n";
    
    // 2. Include OrderModel and create test order
    require_once 'SOURCE CODE/Employee/src/models/OrderModel.php';
    $orderModel = new OrderModel();
    
    // Create test order data
    $orderData = [
        'order_type' => 'dine-in',
        'customer_name' => 'Auto-Deduction Test',
        'items' => [
            [
                'product_id' => $testProduct['id'],
                'product_name' => $testProduct['name'],
                'quantity' => 1,
                'unit_price' => 100.00,
                'total_price' => 100.00,
                'addons' => []
            ]
        ],
        'total_amount' => 100.00,
        'notes' => 'Auto-deduction test order'
    ];
    
    echo "2. Creating test order...\n";
    $createResult = $orderModel->createOrder($orderData);
    
    if ($createResult['status'] !== 'success') {
        echo "❌ Failed to create test order: " . $createResult['message'] . "\n";
        exit;
    }
    
    $orderId = $createResult['id'];
    $orderNumber = $createResult['order_number'];
    
    echo "✅ Test order created successfully\n";
    echo "   Order ID: {$orderId}\n";
    echo "   Order Number: {$orderNumber}\n\n";
    
    // 3. Get stock before completion
    $stmt = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
    $stmt->execute([$testProduct['id']]);
    $stockBefore = $stmt->fetchColumn();
    
    echo "3. Stock before completion: {$stockBefore}\n";
    
    // 4. Complete the order (this should trigger auto-deduction)
    echo "4. Completing order to trigger auto-deduction...\n";
    $updateResult = $orderModel->updateStatus($orderId, 'completed');
    
    if ($updateResult['status'] !== 'success') {
        echo "❌ Failed to complete order: " . $updateResult['message'] . "\n";
        exit;
    }
    
    echo "✅ Order status updated: " . $updateResult['message'] . "\n";
    
    // 5. Check stock after completion
    $stmt = $pdo->prepare("SELECT stock_quantity FROM products WHERE id = ?");
    $stmt->execute([$testProduct['id']]);
    $stockAfter = $stmt->fetchColumn();
    
    echo "5. Stock after completion: {$stockAfter}\n\n";
    
    // 6. Verify deduction worked
    $expectedDeduction = 1;
    $actualDeduction = $stockBefore - $stockAfter;
    
    echo "=== RESULTS ===\n";
    echo "Stock Before: {$stockBefore}\n";
    echo "Stock After: {$stockAfter}\n";
    echo "Expected Deduction: {$expectedDeduction}\n";
    echo "Actual Deduction: {$actualDeduction}\n";
    
    if ($actualDeduction === $expectedDeduction) {
        echo "✅ AUTO-DEDUCTION WORKING CORRECTLY!\n";
    } else {
        echo "❌ AUTO-DEDUCTION FAILED - Stock not properly deducted\n";
        
        // Check if there were any errors in the update result
        if (isset($updateResult['data']['inventory_deducted'])) {
            echo "Inventory deducted flag: " . ($updateResult['data']['inventory_deducted'] ? 'true' : 'false') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
