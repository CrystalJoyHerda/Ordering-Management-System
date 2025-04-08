<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    $conn = new PDO(
        "mysql:host=localhost;dbname=employee_db",
        "emp",
        "emp",
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );
    
    echo json_encode([
        'status' => 'success',
        'message' => '🎉 Successfully connected to employee_db!',
        'database' => 'employee_db',
        'user' => 'emp',
        'server_version' => $conn->getAttribute(PDO::ATTR_SERVER_VERSION)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Connection failed: ' . $e->getMessage()
    ]);
}