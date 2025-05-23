<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Database Connection Test</h2>";

try {
    // Try connecting with the emp user
    $conn = new PDO("mysql:host=localhost;dbname=employee_db", "emp", "emp");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color:green'>✓ Successfully connected with emp user!</p>";
    
    // Check if employees table exists
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>Tables found: " . implode(", ", $tables) . "</p>";
    
    // Try to query the employees table
    $stmt = $conn->query("SELECT COUNT(*) as count FROM employees");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Number of employees in database: " . $result['count'] . "</p>";
    
} catch(PDOException $e) {
    echo "<p style='color:red'>Connection failed: " . $e->getMessage() . "</p>";
    
    // Try root user as fallback
    try {
        $conn = new PDO("mysql:host=localhost", "root", "");
        echo "<p style='color:orange'>✓ Could connect as root, but not as emp user. Need to create emp user.</p>";
    } catch(PDOException $e2) {
        echo "<p style='color:red'>Root connection also failed: " . $e2->getMessage() . "</p>";
    }
}
?>
