<?php
echo "Starting debug...\n";

try {
    $host = 'localhost';
    $dbname = 'employee_db';
    $username = 'root';
    $password = '';
    
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Database connected successfully\n";
    
    // Check current orders
    $stmt = $conn->query('SELECT id, order_number, status, total_amount FROM orders ORDER BY created_at DESC LIMIT 5');
    $orders = $stmt->fetchAll();
    
    echo "Found " . count($orders) . " orders:\n";
    echo str_repeat('=', 60) . "\n";
    
    foreach ($orders as $order) {
        echo "ID: {$order['id']} | Order#: {$order['order_number']} | Status: {$order['status']} | Amount: ₱{$order['total_amount']}\n";
    }
    echo str_repeat('=', 60) . "\n";
    
    // Test order status update if orders exist
    if (count($orders) > 0) {
        $firstOrderId = $orders[0]['id'];
        $currentStatus = $orders[0]['status'];
        
        echo "\nTesting status update for Order ID: $firstOrderId (current status: $currentStatus)\n";
        
        // Try updating status to 'completed'
        $newStatus = 'completed';
        $updateStmt = $conn->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $success = $updateStmt->execute([$newStatus, $firstOrderId]);
        
        if ($success) {
            echo "✅ UPDATE executed successfully\n";
            
            // Check if it was actually updated
            $checkStmt = $conn->prepare('SELECT status FROM orders WHERE id = ?');
            $checkStmt->execute([$firstOrderId]);
            $actualStatus = $checkStmt->fetchColumn();
            
            echo "Status in database now: $actualStatus\n";
            
            if ($actualStatus === $newStatus) {
                echo "✅ Status update SUCCESSFUL!\n";
            } else {
                echo "❌ Status update FAILED - expected '$newStatus', got '$actualStatus'\n";
            }
        } else {
            echo "❌ UPDATE query failed\n";
        }
    }
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>