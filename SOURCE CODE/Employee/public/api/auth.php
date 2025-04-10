<?php
// filepath: c:\xampp\htdocs\Employee\public\api\auth.php

// Start output buffering from the beginning
ob_start();

// Include files that might output HTML
require_once '../../src/config/database.php';
require_once '../../src/models/Employee.php';

// Clear any output generated before this point
ob_clean();

// Now set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize employee object
$employee = new Employee();

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Get posted data
$data = json_decode(file_get_contents('php://input'), true);

// Validate data
if (!isset($data['name']) || !isset($data['password'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Name and password are required'
    ]);
    exit;
}

// Login user
$result = $employee->login($data['name'], $data['password']);

// Return response
echo json_encode($result);
?>