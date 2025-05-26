<?php
require_once 'database.php';

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query('DESCRIBE products');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Products table columns:\n";
    foreach ($columns as $col) {
        echo "- " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
    
    // Also check if there are any existing products
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM products');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nNumber of products in table: " . $result['count'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
