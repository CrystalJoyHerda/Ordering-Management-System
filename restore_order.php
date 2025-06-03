<?php
require_once 'SOURCE CODE/Employee/src/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Restore order 770 to pending
    $stmt = $conn->prepare('UPDATE orders SET status = ? WHERE order_number = ?');
    $result = $stmt->execute(['pending', '770']);
    echo 'Order 770 restored to pending: ' . ($result ? 'SUCCESS' : 'FAILED') . "\n";
    
    // Check current status
    $stmt = $conn->prepare('SELECT status, created_at FROM orders WHERE order_number = ?');
    $stmt->execute(['770']);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($order) {
        echo 'Current status: ' . $order['status'] . "\n";
        echo 'Created at: ' . $order['created_at'] . "\n";
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>
