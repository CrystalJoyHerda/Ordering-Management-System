<?php
/**
 * Test script for auto-cancellation feature
 * This script tests the automatic cancellation of old pending orders
 */

// Set timezone to Philippine time
date_default_timezone_set('Asia/Manila');

require_once 'SOURCE CODE/Employee/src/config/database.php';
require_once 'SOURCE CODE/Employee/src/models/OrderModel.php';

echo "<h1>Auto-Cancellation Feature Test</h1>";
echo "<p>Testing automatic cancellation of old pending orders...</p>";
echo "<p><strong>Current Date:</strong> " . date('Y-m-d H:i:s') . "</p>";

try {
    $order = new OrderModel();
    
    // First, let's see what pending orders exist
    echo "<h2>Step 1: Checking existing pending orders</h2>";
    $db = Database::getConnection();
    $stmt = $db->prepare("SELECT id, order_number, created_at, status FROM orders WHERE status = 'pending' ORDER BY created_at DESC");
    $stmt->execute();
    $pendingOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($pendingOrders)) {
        echo "<p>No pending orders found in the database.</p>";
        
        // Create a test order from yesterday for demonstration
        echo "<h3>Creating a test order from yesterday...</h3>";
        $yesterday = date('Y-m-d H:i:s', strtotime('-1 day'));
        
        $testOrderSql = "INSERT INTO orders (order_number, total_amount, order_type, status, created_at, updated_at) 
                        VALUES ('TEST001', 150.00, 'dine_in', 'pending', ?, ?)";
        $stmt = $db->prepare($testOrderSql);
        $stmt->execute([$yesterday, $yesterday]);
        
        echo "<p>✅ Created test order 'TEST001' with date: $yesterday</p>";
        
        // Refresh pending orders
        $stmt = $db->prepare("SELECT id, order_number, created_at, status FROM orders WHERE status = 'pending' ORDER BY created_at DESC");
        $stmt->execute();
        $pendingOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>Order ID</th><th>Order Number</th><th>Created At</th><th>Status</th><th>Days Old</th></tr>";
    
    foreach ($pendingOrders as $pendingOrder) {
        $createdDate = new DateTime($pendingOrder['created_at']);
        $currentDate = new DateTime();
        $daysDiff = $currentDate->diff($createdDate)->days;
        
        echo "<tr>";
        echo "<td>" . htmlspecialchars($pendingOrder['id']) . "</td>";
        echo "<td>" . htmlspecialchars($pendingOrder['order_number']) . "</td>";
        echo "<td>" . htmlspecialchars($pendingOrder['created_at']) . "</td>";
        echo "<td>" . htmlspecialchars($pendingOrder['status']) . "</td>";
        echo "<td>" . $daysDiff . " days</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Run the auto-cancellation function
    echo "<h2>Step 2: Running auto-cancellation process</h2>";
    $result = $order->autoCancelOldPendingOrders();
    
    echo "<div style='background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
    echo "<h3>Auto-Cancellation Results:</h3>";
    echo "<pre>" . json_encode($result, JSON_PRETTY_PRINT) . "</pre>";
    echo "</div>";
    
    // Check the orders again after cancellation
    echo "<h2>Step 3: Checking orders after auto-cancellation</h2>";
    $stmt = $db->prepare("SELECT id, order_number, created_at, status FROM orders WHERE order_number LIKE 'TEST%' OR created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC");
    $stmt->execute();
    $allOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>Order ID</th><th>Order Number</th><th>Created At</th><th>Status</th><th>Days Old</th></tr>";
    
    foreach ($allOrders as $orderRow) {
        $createdDate = new DateTime($orderRow['created_at']);
        $currentDate = new DateTime();
        $daysDiff = $currentDate->diff($createdDate)->days;
        
        $statusColor = $orderRow['status'] === 'cancelled' ? 'color: red; font-weight: bold;' : '';
        
        echo "<tr>";
        echo "<td>" . htmlspecialchars($orderRow['id']) . "</td>";
        echo "<td>" . htmlspecialchars($orderRow['order_number']) . "</td>";
        echo "<td>" . htmlspecialchars($orderRow['created_at']) . "</td>";
        echo "<td style='$statusColor'>" . htmlspecialchars($orderRow['status']) . "</td>";
        echo "<td>" . $daysDiff . " days</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Summary
    echo "<h2>Summary</h2>";
    if ($result['success']) {
        echo "<p>✅ <strong>Auto-cancellation completed successfully!</strong></p>";
        echo "<p>📊 <strong>Orders cancelled:</strong> " . $result['cancelled_count'] . "</p>";
        
        if ($result['cancelled_count'] > 0) {
            echo "<p>📋 <strong>Cancelled order details:</strong></p>";
            echo "<ul>";
            foreach ($result['cancelled_orders'] as $cancelledOrder) {
                echo "<li>Order #" . htmlspecialchars($cancelledOrder['order_number']) . 
                     " (ID: " . htmlspecialchars($cancelledOrder['id']) . 
                     ", Created: " . htmlspecialchars($cancelledOrder['created_at']) . ")</li>";
            }
            echo "</ul>";
        }
    } else {
        echo "<p>❌ <strong>Auto-cancellation failed:</strong> " . htmlspecialchars($result['message']) . "</p>";
    }
    
} catch (Exception $e) {
    echo "<div style='background: #ffebee; color: #c62828; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
    echo "<h3>Error occurred:</h3>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}

echo "<hr>";
echo "<p><em>Test completed at: " . date('Y-m-d H:i:s') . "</em></p>";
?>
