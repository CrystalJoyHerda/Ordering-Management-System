<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->email) || !isset($data->newPassword)) {
        throw new Exception('Missing required fields');
    }

    $hashedPassword = hash('sha256', $data->newPassword);
    $query = "UPDATE employees SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $hashedPassword, $data->email);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['status' => 'success']);
        } else {
            throw new Exception('Email not found');
        }
    } else {
        throw new Exception('Failed to update password');
    }

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
