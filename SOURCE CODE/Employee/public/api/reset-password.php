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
    
    if (!isset($data->email) || !isset($data->newPassword)) {
        throw new Exception('Email and new password are required');
    }
    
    if (empty($data->email) || empty($data->newPassword)) {
        throw new Exception('Email and new password cannot be empty');
    }
    
    // Validate email format
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate password length (minimum 4 characters)
    if (strlen($data->newPassword) < 4) {
        throw new Exception('Password must be at least 4 characters long');
    }
    
    // First, verify the email exists
    $checkQuery = "SELECT emp_id, name FROM employees WHERE email = :email";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':email', $data->email);
    $checkStmt->execute();
    
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('No account found with this email address');
    }
    
    // Hash password using SHA256 to match authentication method
    $hashedPassword = hash('sha256', $data->newPassword);
    
    // Update password
    $updateQuery = "UPDATE employees SET password_hash = :password, updated_at = CURRENT_TIMESTAMP WHERE email = :email";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(':password', $hashedPassword);
    $updateStmt->bindParam(':email', $data->email);

    if ($updateStmt->execute()) {
        if ($updateStmt->rowCount() > 0) {
            $response = [
                'status' => 'success',
                'message' => 'Password reset successfully for ' . $user['name']
            ];
        } else {
            throw new Exception('Failed to update password');
        }
    } else {
        throw new Exception('Database error occurred while updating password');
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
        'message' => $e->getMessage()
    ]);
}
?>
