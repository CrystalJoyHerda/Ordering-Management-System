<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

require_once '../../src/config/database.php';

try {
    // Get and validate JSON input
    $jsonInput = file_get_contents('php://input');
    if (!$jsonInput) {
        throw new Exception('No input received');
    }

    $data = json_decode($jsonInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON format: ' . json_last_error_msg());
    }

    // Validate required fields
    if (empty($data['username']) || empty($data['password'])) {
        throw new Exception('Username and password are required');
    }

    // Connect to database
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Verify database selection
    $dbQuery = $conn->query("SELECT DATABASE()");
    $dbName = $dbQuery->fetchColumn();
    if ($dbName !== 'employee_db') {
        throw new Exception("Wrong database connected: $dbName");
    }

    // Prepare login query with explicit database name
    $query = "SELECT 
                emp_id,
                name,
                role,
                email,
                created_at,
                updated_at
              FROM employee_db.employees 
              WHERE name = :username 
              AND password_hash = SHA2(:password, 256)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':username', $data['username']);
    $stmt->bindParam(':password', $data['password']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Start session and store user data
        session_start();
        $_SESSION['user'] = $user;
        $_SESSION['last_activity'] = time();

        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => $user
        ]);
    } else {
        throw new Exception('Invalid username or password');
    }

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}