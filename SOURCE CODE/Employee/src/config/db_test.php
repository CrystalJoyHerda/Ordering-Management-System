<?php
// filepath: c:\xampp\htdocs\Employee\db_test.php

// Include the Database class
require_once 'src/config/database.php';

// Test database.php connection
try {
    // Create a new Database instance
    $database = new Database();
    
    // Get connection from the Database class
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "Connection successful! Database class from database.php is working properly.";
        
        // Get database info from connection to verify
        $stmt = $conn->query("SELECT DATABASE() as db_name");
        $result = $stmt->fetch();
        $dbname = $result['db_name'];
        
        echo "<br>Connected to database: " . $dbname;
        
        // Test a simple query to verify connection is functional
        try {
            $query = "SHOW TABLES";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo "<br>Tables in database: " . implode(", ", $tables);
        } catch(PDOException $e) {
            echo "<br>Query error: " . $e->getMessage();
        }
    } else {
        echo "Connection failed: getConnection() returned null";
    }
} catch(Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>