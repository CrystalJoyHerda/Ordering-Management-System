<?php
// Add sample sales data for testing
require_once 'SOURCE CODE/Employee/src/config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Clear existing data first
    $conn->exec("DELETE FROM order_items");
    $conn->exec("DELETE FROM orders");
    $conn->exec("ALTER TABLE orders AUTO_INCREMENT = 1");
    
    // Add sample products if they don't exist
    $products = [
        ['id' => 1, 'name' => 'Espresso', 'price' => 120.00],
        ['id' => 2, 'name' => 'Americano', 'price' => 130.00],
        ['id' => 3, 'name' => 'Latte', 'price' => 150.00],
        ['id' => 4, 'name' => 'Cappuccino', 'price' => 140.00],
        ['id' => 5, 'name' => 'Iced Coffee', 'price' => 110.00],
        ['id' => 6, 'name' => 'Frappuccino', 'price' => 180.00],
        ['id' => 7, 'name' => 'Croissant', 'price' => 85.00],
        ['id' => 8, 'name' => 'Blueberry Muffin', 'price' => 95.00],
        ['id' => 9, 'name' => 'Carrot Cake', 'price' => 190.00],
        ['id' => 10, 'name' => 'Donut', 'price' => 80.00]
    ];
    
    // Insert products
    foreach ($products as $product) {
        $stmt = $conn->prepare("INSERT IGNORE INTO products (id, name, description, price, category, is_available) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->execute([$product['id'], $product['name'], $product['name'] . ' description', $product['price'], 'Beverages']);
    }
    
    // Generate sales for today (May 27, 2025)
    $today = '2025-05-27';
    $totalOrders = 0;
    $totalRevenue = 0;
    
    // Create orders throughout the day
    for ($hour = 9; $hour <= 20; $hour++) {
        for ($orderNum = 0; $orderNum < rand(1, 3); $orderNum++) {
            $minute = rand(0, 59);
            $orderTime = $today . ' ' . sprintf('%02d:%02d:00', $hour, $minute);
            
            // Random customer ID
            $customerId = rand(1, 20);
            
            // Create order
            $orderQuery = "INSERT INTO orders (customer_id, total_amount, status, created_at) VALUES (?, ?, 'completed', ?)";
            $stmt = $conn->prepare($orderQuery);
            
            // Calculate order total
            $orderTotal = 0;
            $orderItems = [];
            
            // Add 1-4 items per order
            $itemCount = rand(1, 4);
            for ($i = 0; $i < $itemCount; $i++) {
                $productIndex = rand(0, count($products) - 1);
                $product = $products[$productIndex];
                $quantity = rand(1, 2);
                $itemTotal = $product['price'] * $quantity;
                $orderTotal += $itemTotal;
                
                $orderItems[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'quantity' => $quantity,
                    'price' => $product['price']
                ];
            }
            
            // Insert order
            $stmt->execute([$customerId, $orderTotal, $orderTime]);
            $orderId = $conn->lastInsertId();
            
            // Insert order items
            foreach ($orderItems as $item) {
                $itemQuery = "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($itemQuery);
                $stmt->execute([$orderId, $item['product_id'], $item['product_name'], $item['quantity'], $item['price']]);
            }
            
            $totalOrders++;
            $totalRevenue += $orderTotal;
        }
    }
    
    // Also add some data for the past few days
    for ($day = 1; $day <= 6; $day++) {
        $date = date('Y-m-d', strtotime("-$day days", strtotime($today)));
        
        for ($orderNum = 0; $orderNum < rand(5, 15); $orderNum++) {
            $hour = rand(9, 20);
            $minute = rand(0, 59);
            $orderTime = $date . ' ' . sprintf('%02d:%02d:00', $hour, $minute);
            
            $customerId = rand(1, 20);
            $orderTotal = 0;
            $orderItems = [];
            
            $itemCount = rand(1, 3);
            for ($i = 0; $i < $itemCount; $i++) {
                $productIndex = rand(0, count($products) - 1);
                $product = $products[$productIndex];
                $quantity = rand(1, 2);
                $itemTotal = $product['price'] * $quantity;
                $orderTotal += $itemTotal;
                
                $orderItems[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'quantity' => $quantity,
                    'price' => $product['price']
                ];
            }
            
            $orderQuery = "INSERT INTO orders (customer_id, total_amount, status, created_at) VALUES (?, ?, 'completed', ?)";
            $stmt = $conn->prepare($orderQuery);
            $stmt->execute([$customerId, $orderTotal, $orderTime]);
            $orderId = $conn->lastInsertId();
            
            foreach ($orderItems as $item) {
                $itemQuery = "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($itemQuery);
                $stmt->execute([$orderId, $item['product_id'], $item['product_name'], $item['quantity'], $item['price']]);
            }
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Sample sales data created successfully',
        'orders_created_today' => $totalOrders,
        'total_revenue_today' => $totalRevenue,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create sample data: ' . $e->getMessage()
    ]);
}
?>
