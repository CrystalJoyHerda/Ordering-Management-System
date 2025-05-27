<?php
// Simple script to add test orders for sales history demonstration
require_once 'SOURCE CODE/Employee/src/config/database.php';

try {
    $conn = new PDO("mysql:host=localhost;dbname=employee_db", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Sales History Test Data Generator</h2>";
    echo "<p>This script will add sample orders to test the sales history page.</p>";
    
    // Check if orders already exist
    $checkQuery = "SELECT COUNT(*) as order_count FROM orders WHERE DATE(created_at) = CURDATE()";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['order_count'] > 0) {
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
        echo "✅ Found {$result['order_count']} orders for today. Your sales history should show data!";
        echo "</div>";
    } else {
        echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
        echo "⚠️ No orders found for today. Click the button below to add sample data.";
        echo "</div>";
        
        if (isset($_POST['add_test_data'])) {
            // Add sample orders
            $sampleOrders = [
                ['product' => 'Cappuccino', 'quantity' => 3, 'price' => 150.00],
                ['product' => 'Americano', 'quantity' => 2, 'price' => 130.00],
                ['product' => 'Latte', 'quantity' => 1, 'price' => 140.00],
                ['product' => 'Espresso', 'quantity' => 4, 'price' => 120.00],
            ];
            
            foreach ($sampleOrders as $order) {
                // Create order
                $orderQuery = "INSERT INTO orders (order_number, order_type, total_amount, status, created_at) VALUES (?, 'takeout', ?, 'completed', NOW())";
                $stmt = $conn->prepare($orderQuery);
                $orderNumber = 'TEST' . rand(100, 999);
                $totalAmount = $order['quantity'] * $order['price'];
                $stmt->execute([$orderNumber, $totalAmount]);
                $orderId = $conn->lastInsertId();
                
                // Create order item
                $itemQuery = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, created_at) VALUES (?, 1, ?, ?, ?, ?, NOW())";
                $stmt = $conn->prepare($itemQuery);
                $stmt->execute([$orderId, $order['product'], $order['quantity'], $order['price'], $totalAmount]);
            }
            
            echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
            echo "✅ Sample orders added successfully! Your sales history page should now show data.";
            echo "</div>";
        } else {
            echo "<form method='post' style='margin: 10px 0;'>";
            echo "<button type='submit' name='add_test_data' style='background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;'>Add Sample Data</button>";
            echo "</form>";
        }
    }
    
    // Show current orders
    echo "<h3>Current Orders for Today:</h3>";
    $todayQuery = "SELECT o.*, GROUP_CONCAT(oi.product_name) as products FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE DATE(o.created_at) = CURDATE() GROUP BY o.id ORDER BY o.created_at DESC";
    $stmt = $conn->prepare($todayQuery);
    $stmt->execute();
    $orders = $stmt->fetchAll();
    
    if (count($orders) > 0) {
        echo "<table style='width: 100%; border-collapse: collapse; margin: 10px 0;'>";
        echo "<thead><tr style='background: #f8f9fa;'>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Order #</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Products</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Total</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Time</th>";
        echo "</tr></thead><tbody>";
        
        foreach ($orders as $order) {
            echo "<tr>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$order['order_number']}</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>{$order['products']}</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>₱" . number_format($order['total_amount'], 2) . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . date('H:i', strtotime($order['created_at'])) . "</td>";
            echo "</tr>";
        }
        echo "</tbody></table>";
    } else {
        echo "<p>No orders found.</p>";
    }
    
    echo "<hr>";
    echo "<p><a href='test_sales_api.html'>🔗 Test Sales API</a> | <a href='SOURCE%20CODE/SystemDesign/pages/saleshistorycashier.html'>🔗 Open Sales History Page</a></p>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
    echo "❌ Database Error: " . $e->getMessage();
    echo "<br><br>Please ensure:";
    echo "<ul>";
    echo "<li>XAMPP is running</li>";
    echo "<li>MySQL service is started</li>";
    echo "<li>Database 'employee_db' exists</li>";
    echo "</ul>";
    echo "</div>";
}
?>
