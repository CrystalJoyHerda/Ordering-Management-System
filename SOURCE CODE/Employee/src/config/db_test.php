<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Using absolute path with __DIR__ since both files are in the same directory
require_once __DIR__ . '/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if($db) {
        // Test connection and get database info
        $stmt = $db->query("SELECT DATABASE() as current_db");
        $result = $stmt->fetch();
        
        // Get list of tables
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Add table structure information
        $tableInfo = [];
        foreach ($tables as $table) {
            $stmt = $db->query("DESCRIBE $table");
            $tableInfo[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Database connection successful',
            'database' => $result['current_db'],
            'tables' => $tables,
            'table_structure' => $tableInfo,
            'connection_info' => [
                'host' => $database->host,
                'database' => $database->dbname
            ]
        ], JSON_PRETTY_PRINT);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Connection failed: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>