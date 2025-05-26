<?php
// Simple debug script to test order lookup directly
header('Content-Type: application/json');

try {
    // Include the required files
    require_once __DIR__ . '/SOURCE CODE/Employee/src/config/database.php';
    require_once __DIR__ . '/SOURCE CODE/Employee/src/models/OrderModel.php';
    
    echo "Database files loaded successfully.\n";
    
    // Initialize order model
    $orderModel = new OrderModel();
    echo "OrderModel initialized successfully.\n";
    
    // Test database connection
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "Database connection successful.\n";
        
        // Check if there are any orders in the database
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders");
        $stmt->execute();
        $result = $stmt->fetch();
        echo "Total orders in database: " . $result['count'] . "\n";
        
        // Get the latest order
        $stmt = $conn->prepare("SELECT order_number FROM orders ORDER BY id DESC LIMIT 1");
        $stmt->execute();
        $latestOrder = $stmt->fetch();
        
        if ($latestOrder) {
            echo "Latest order number: " . $latestOrder['order_number'] . "\n";
            
            // Test the getByOrderNumber method
            $orderResult = $orderModel->getByOrderNumber($latestOrder['order_number']);
            echo "Order lookup result:\n";
            echo json_encode($orderResult, JSON_PRETTY_PRINT);
        } else {
            echo "No orders found in database.\n";
        }
        
    } else {
        echo "Database connection failed.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
