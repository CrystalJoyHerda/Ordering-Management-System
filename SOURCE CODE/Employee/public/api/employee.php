<?php
// filepath: c:\xampp\htdocs\Employee\public\api\employees.php

// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include employee model
require_once '../../src/models/Employee.php';

// Initialize employee object
$employee = new Employee();

// Get request method
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Check for method override (for PUT/DELETE)
if ($requestMethod === 'POST' && isset($_GET['_method'])) {
    $requestMethod = $_GET['_method'];
}

// Handle request based on HTTP method
switch ($requestMethod) {
    case 'GET':
        // Get all employees or single employee
        if (isset($_GET['id'])) {
            // Get single employee
            $result = $employee->getById($_GET['id']);
            echo json_encode($result);
        } else {
            // Get all employees
            $employees = $employee->getAll();
            echo json_encode([
                'status' => 'success',
                'data' => $employees
            ]);
        }
        break;
        
    case 'POST':
        // Create new employee
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $employee->create($data);
        echo json_encode($result);
        break;
        
    case 'PUT':
        // Update employee
        if (!isset($_GET['id'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Employee ID is required'
            ]);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $employee->update($_GET['id'], $data);
        echo json_encode($result);
        break;
        
    case 'DELETE':
        // Delete employee
        if (!isset($_GET['id'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Employee ID is required'
            ]);
            break;
        }
        
        $result = $employee->delete($_GET['id']);
        echo json_encode($result);
        break;
        
    default:
        // Method not allowed
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
        break;
}
?>