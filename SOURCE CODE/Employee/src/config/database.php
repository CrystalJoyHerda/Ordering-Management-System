<?php
// Updated file path to match actual URL access path
// http://localhost/SOURCE_CODE/Employee/public/api/auth.php

// Disable error display for production
error_reporting(E_ALL);
ini_set('display_errors', 0);

class Database {
    private static $conn = null;
    private $host = "localhost";
    private $dbname = "employee_db";
    private $username = "root";    // XAMPP default MySQL username
    private $password = "";        // XAMPP default MySQL password (empty)

    /**
     * Get database connection
     * 
     * @return PDO
     */
    public function getConnection() {
        if (self::$conn === null) {
            try {
                $options = array(
                    PDO::ATTR_PERSISTENT => true,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                );

                self::$conn = new PDO(
                    "mysql:host=" . $this->host . ";dbname=" . $this->dbname,
                    $this->username,
                    $this->password,
                    $options
                );

                error_log("[DATABASE] Connection successful");
            } catch(PDOException $e) {
                error_log("[DATABASE] Connection error: " . $e->getMessage());
                throw new Exception("Database connection failed");
            }
        }
        return self::$conn;
    }
}
?>