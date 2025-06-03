<?php
// Updated file path to match new directory structure
// http://localhost/SOURCE_CODE/Employee/public/api/auth.php

// Display all errors (only for testing)
error_reporting(E_ALL);
ini_set('display_errors', 1);

class Database {
    public $host = 'localhost';
    public $dbname = 'employee_db';
    public $username = 'emp';
    public $password = 'emp';
    private $conn;
    
    /**
     * Get database connection
     * 
     * @return PDO
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            error_log("[DATABASE] Connecting to {$this->dbname} at http://localhost/SOURCE_CODE/Employee/");
            
            // Simplified DSN without explicit port
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            error_log("Database connection successful");
        } catch(PDOException $e) {
            error_log("[DATABASE] Connection error at http://localhost/SOURCE_CODE/Employee/: " . $e->getMessage());
            throw new Exception("Database connection failed. Check configuration.");
        }
        
        return $this->conn;
    }
}

// Self-test code - ONLY runs when file is accessed directly
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    echo "<h2>Database Connection Test</h2>";
    
    // Create an instance of the Database class
    $database = new Database();
    
    // Try to get a connection
    $conn = $database->getConnection();
    
    // Test if connection was successful
    if ($conn) {
        echo "<p style='color:green'>✓ Connection successful!</p>";
        
        // Show what we're connected to
        try {
            $stmt = $conn->query("SELECT DATABASE() as current_db");
            $result = $stmt->fetch();
            echo "<p>Connected to database: <strong>" . $result['current_db'] . "</strong></p>";
            
            // Show tables in the database
            $stmt = $conn->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (count($tables) > 0) {
                echo "<p>Tables found: <strong>" . implode(", ", $tables) . "</strong></p>";
            } else {
                echo "<p>No tables found in database.</p>";
            }
        } catch(PDOException $e) {
            echo "<p style='color:red'>Query error: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p style='color:red'>✗ Connection failed</p>";
    }
}
?>