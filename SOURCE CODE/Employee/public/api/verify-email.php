<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Clean output buffer to prevent any unwanted characters
if (ob_get_level()) {
    ob_clean();
}

require_once '../../src/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    if (!isset($data->email) || empty($data->email)) {
        throw new Exception('Email is required');
    }
    
    // Validate email format
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
      $query = "SELECT emp_id, name, email, role FROM employees WHERE email = :email";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        $response = [
            'status' => 'success',
            'message' => 'Email verified successfully. You can now reset your password.',
            'data' => [
                'emp_id' => $user['emp_id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ];
    } else {
        $response = [
            'status' => 'error',
            'message' => 'No account found with this email address. Please check your email and try again.'
        ];
    }

} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Ensure clean JSON output
header('Content-Length: ' . strlen(json_encode($response)));
echo json_encode($response);
exit;
?>
