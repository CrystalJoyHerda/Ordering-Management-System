<?php
// Test script to verify database connection and order functionality
require_once './SOURCE CODE/Employee/src/config/database.php';
require_once './SOURCE CODE/Employee/src/models/OrderModel.php';

try {
    echo "Testing database connection...\n";
    
    // Test database connection
    $database = new Database();
    $db = $database->getConnection();
    echo "Database connection: SUCCESS\n";
    
    // Test OrderModel
    $orderModel = new OrderModel();
    echo "OrderModel instantiation: SUCCESS\n";
    
    // Test fetching orders
    $result = $orderModel->getAllOrders(null, 5);
    if ($result['status'] === 'success') {
        echo "Get all orders: SUCCESS\n";
        echo "Found " . count($result['data']) . " orders\n";
    } else {
        echo "Get all orders: ERROR - " . $result['message'] . "\n";
    }
    
    // Test products table
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'");
    $stmt->execute();
    $productCount = $stmt->fetch()['count'];
    echo "Active products in database: $productCount\n";
    
    echo "\nDatabase integration test completed successfully!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Please ensure:\n";
    echo "1. MySQL server is running\n";
    echo "2. Database 'employee_db' exists\n";
    echo "3. Database user 'emp' with password 'emp' has access\n";
    echo "4. All required tables are created\n";
}
?>
