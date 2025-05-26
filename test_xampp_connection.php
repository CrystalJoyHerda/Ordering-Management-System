<?php
// Test database connection for XAMPP setup
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection parameters for XAMPP
    $host = "localhost";
    $dbname = "employee_db";
    $username = "root"; // Default XAMPP MySQL username
    $password = "";     // Default XAMPP MySQL password (empty)
    
    // Create PDO connection
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Test query to check if tables exist
    $tables = ['orders', 'order_items', 'products', 'addons', 'employees'];
    $tableStatus = [];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $result = $stmt->fetch();
            $tableStatus[$table] = [
                'exists' => true,
                'count' => $result['count']
            ];
        } catch (PDOException $e) {
            $tableStatus[$table] = [
                'exists' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful',
        'database' => $dbname,
        'tables' => $tableStatus,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
