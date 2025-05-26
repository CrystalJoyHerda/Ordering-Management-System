<?php
// Update all products with meaningful stock quantities
require_once './SOURCE CODE/Employee/src/config/database.php';
require_once './SOURCE CODE/Employee/src/models/ProductModel.php';

// Force output to appear immediately
ob_implicit_flush(true);

try {
    $productModel = new ProductModel();
    $result = $productModel->getAllProducts();
    
    if ($result['status'] === 'success') {
        echo "Updating all products with meaningful stock quantities...\n";
        echo str_repeat('=', 60) . "\n";
        
        $updatedCount = 0;
        $errorCount = 0;
        
        foreach ($result['data'] as $product) {
            // Determine stock quantity based on category
            $stockQuantity = 25; // Default
            $lowStockThreshold = 5;
            
            switch ($product['category']) {
                case 'coffee':
                    $stockQuantity = 50; // High demand items
                    $lowStockThreshold = 10;
                    break;
                case 'beverages':
                    $stockQuantity = 30;
                    $lowStockThreshold = 8;
                    break;
                case 'pastries':
                    $stockQuantity = 20;
                    $lowStockThreshold = 5;
                    break;
                case 'sandwiches':
                    $stockQuantity = 15;
                    $lowStockThreshold = 3;
                    break;
                case 'cakes':
                    $stockQuantity = 8; // Lower quantity for special items
                    $lowStockThreshold = 2;
                    break;
                default:
                    $stockQuantity = 25;
                    $lowStockThreshold = 5;
            }
            
            // Skip if already has adequate stock
            if ($product['stock_quantity'] > 10) {
                echo "SKIP: {$product['name']} already has adequate stock ({$product['stock_quantity']})\n";
                continue;
            }
            
            // Update the product stock
            $updateData = [
                'stock_quantity' => $stockQuantity,
                'reason' => 'RESTOCK',
                'notes' => 'Initial stock setup - bulk update all products'
            ];
            
            $updateResult = $productModel->updateStock($product['id'], $updateData);
            
            if ($updateResult['status'] === 'success') {
                echo "✅ {$product['name']}: Updated stock to {$stockQuantity} (threshold: {$lowStockThreshold})\n";
                $updatedCount++;
            } else {
                echo "❌ {$product['name']}: FAILED - {$updateResult['message']}\n";
                $errorCount++;
            }
        }
        
        echo str_repeat('=', 60) . "\n";
        echo "Update Summary:\n";
        echo "✅ Successfully updated: {$updatedCount} products\n";
        echo "❌ Failed updates: {$errorCount} products\n";
        echo "📦 Total products processed: " . count($result['data']) . "\n";
        
    } else {
        echo "Error fetching products: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
