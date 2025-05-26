<?php
// Test script to verify stock functionality setup
require_once dirname(__DIR__) . '/Employee/src/config/database.php';
require_once dirname(__DIR__) . '/Employee/src/models/ProductModel.php';

try {
    echo "<h2>Stock Management Setup Test</h2>";
    
    // Test database connection
    $pdo = Database::getConnection();
    echo "✅ Database connection successful<br>";
    
    // Create ProductModel instance (this will auto-create columns)
    $productModel = new ProductModel();
    echo "✅ ProductModel initialized (columns auto-created)<br>";
    
    // Check products table structure
    $stmt = $pdo->query("DESCRIBE products");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Products Table Structure:</h3>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Default</th></tr>";
    
    $stockColumns = ['stock_quantity', 'low_stock_threshold', 'updated_at'];
    $foundStockColumns = [];
    
    foreach ($columns as $col) {
        $isStockColumn = in_array($col['Field'], $stockColumns);
        if ($isStockColumn) $foundStockColumns[] = $col['Field'];
        
        $rowColor = $isStockColumn ? 'background-color: #d4edda;' : '';
        echo "<tr style='{$rowColor}'>";
        echo "<td>{$col['Field']}</td>";
        echo "<td>{$col['Type']}</td>";
        echo "<td>{$col['Null']}</td>";
        echo "<td>{$col['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Check if stock columns exist
    echo "<h3>Stock Columns Status:</h3>";
    foreach ($stockColumns as $column) {
        if (in_array($column, $foundStockColumns)) {
            echo "✅ {$column} - EXISTS<br>";
        } else {
            echo "❌ {$column} - MISSING<br>";
        }
    }
    
    // Check if stock_history table exists
    try {
        $stmt = $pdo->query("DESCRIBE stock_history");
        echo "<h3>Stock History Table:</h3>";
        echo "✅ stock_history table exists<br>";
        
        $historyColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Default</th></tr>";
        foreach ($historyColumns as $col) {
            echo "<tr>";
            echo "<td>{$col['Field']}</td>";
            echo "<td>{$col['Type']}</td>";
            echo "<td>{$col['Null']}</td>";
            echo "<td>{$col['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } catch (Exception $e) {
        echo "<h3>Stock History Table:</h3>";
        echo "❌ stock_history table does not exist yet (will be created on first stock update)<br>";
    }
    
    // Test API endpoints
    echo "<h3>API Endpoint Test:</h3>";
    $testUrl = "http://localhost/Employee/public/api/products.php";
    echo "📡 Products API URL: <a href='{$testUrl}' target='_blank'>{$testUrl}</a><br>";
    
    // Try to get products
    $result = $productModel->getAllProducts();
    if ($result['status'] === 'success') {
        $productCount = count($result['data']);
        echo "✅ API can fetch {$productCount} products<br>";
        
        if ($productCount > 0) {
            $sampleProduct = $result['data'][0];
            echo "📝 Sample product: {$sampleProduct['name']} (ID: {$sampleProduct['id']})<br>";
            
            // Check if sample product has stock fields
            $hasStock = isset($sampleProduct['stock_quantity']);
            $hasThreshold = isset($sampleProduct['low_stock_threshold']);
            
            if ($hasStock && $hasThreshold) {
                echo "✅ Sample product has stock fields: quantity={$sampleProduct['stock_quantity']}, threshold={$sampleProduct['low_stock_threshold']}<br>";
            } else {
                echo "⚠️ Sample product missing stock fields - this is normal for existing products<br>";
            }
        }
    } else {
        echo "❌ API error: " . $result['message'] . "<br>";
    }
    
    echo "<h3>Test Complete!</h3>";
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ul>";
    echo "<li>Open the inventory page: <a href='http://127.0.0.1:5501/pages/inventory.html' target='_blank'>Inventory Management</a></li>";
    echo "<li>Open the stock API test: <a href='http://127.0.0.1:5501/test-stock-api.html' target='_blank'>Stock API Test</a></li>";
    echo "<li>Try creating a new product with stock values</li>";
    echo "<li>Try updating stock for an existing product</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "Stack trace: <pre>" . $e->getTraceAsString() . "</pre>";
}
?>
