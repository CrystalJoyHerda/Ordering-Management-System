<?php
// Check database connection and add sample data if needed
require_once 'SOURCE CODE/Employee/src/config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Check if orders table exists and has data
    $checkQuery = "SELECT COUNT(*) as count FROM orders";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute();
    $orderCount = $stmt->fetch()['count'];
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful',
        'order_count' => $orderCount,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // If no orders exist, let's add some sample data
    if ($orderCount == 0) {
        // Add sample products first
        $productQuery = "INSERT IGNORE INTO products (id, name, description, price, category, image_url, is_available) VALUES 
            (1, 'Fried Rice', 'Delicious fried rice with vegetables', 120.00, 'Rice Meals', 'images/fried-rice.jpg', 1),
            (2, 'Chicken Adobo', 'Filipino style chicken adobo', 150.00, 'Main Course', 'images/chicken-adobo.jpg', 1),
            (3, 'Pancit Canton', 'Stir-fried noodles with vegetables', 100.00, 'Noodles', 'images/pancit.jpg', 1),
            (4, 'Leche Flan', 'Traditional Filipino dessert', 80.00, 'Desserts', 'images/leche-flan.jpg', 1),
            (5, 'Soft Drinks', 'Assorted soft drinks', 35.00, 'Beverages', 'images/softdrinks.jpg', 1)";
        
        $conn->exec($productQuery);
        
        // Add sample orders for the past week
        $today = date('Y-m-d');
        for ($i = 0; $i < 7; $i++) {
            $orderDate = date('Y-m-d', strtotime("-$i days"));
            $orderTime = $orderDate . ' ' . sprintf('%02d:%02d:00', rand(9, 21), rand(0, 59));
            
            // Create 2-5 orders per day
            $ordersPerDay = rand(2, 5);
            for ($j = 0; $j < $ordersPerDay; $j++) {
                $totalAmount = rand(100, 500);
                $customerId = rand(1, 10);
                
                $orderQuery = "INSERT INTO orders (customer_id, total_amount, status, created_at) VALUES (?, ?, 'completed', ?)";
                $stmt = $conn->prepare($orderQuery);
                $stmt->execute([$customerId, $totalAmount, $orderTime]);
                
                $orderId = $conn->lastInsertId();
                
                // Add order items
                $itemCount = rand(1, 3);
                for ($k = 0; $k < $itemCount; $k++) {
                    $productId = rand(1, 5);
                    $quantity = rand(1, 3);
                    $price = rand(50, 200);
                    
                    $itemQuery = "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $conn->prepare($itemQuery);
                    $stmt->execute([$orderId, $productId, "Product $productId", $quantity, $price]);
                }
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Sample data added successfully',
            'orders_created' => $ordersPerDay * 7
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
}
?>
