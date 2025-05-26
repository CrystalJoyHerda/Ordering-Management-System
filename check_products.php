<?php
// Check current products and their stock values
require_once './SOURCE CODE/Employee/src/config/database.php';
require_once './SOURCE CODE/Employee/src/models/ProductModel.php';

try {
    $productModel = new ProductModel();
    $result = $productModel->getAllProducts();
    
    if ($result['status'] === 'success') {
        echo "Current Products in Database:\n";
        echo str_repeat('=', 50) . "\n";
        
        foreach ($result['data'] as $product) {
            echo "ID: " . $product['id'] . "\n";
            echo "Name: " . $product['name'] . "\n";
            echo "Price: PHP " . $product['price'] . "\n";
            echo "Category: " . $product['category'] . "\n";
            echo "Stock Quantity: " . ($product['stock_quantity'] ?? 'NULL') . "\n";
            echo "Low Stock Threshold: " . ($product['low_stock_threshold'] ?? 'NULL') . "\n";
            echo "Status: " . $product['status'] . "\n";
            echo str_repeat('-', 30) . "\n";
        }
        
        echo "\nTotal Products: " . count($result['data']) . "\n";
    } else {
        echo "Error: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
