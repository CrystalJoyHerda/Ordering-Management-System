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
    
    if (!isset($data->email)) {
        throw new Exception('Email is required');
    }
    
    $query = "SELECT emp_id, name FROM employees WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $data->email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode([
            'status' => 'success',
            'message' => 'Email verified successfully',
            'data' => [
                'emp_id' => $user['emp_id'],
                'name' => $user['name']
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email address'
        ]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
