<?php
// filepath: c:\xampp\htdocs\Employee\public\api\employees.php

// Clean any output buffers at start
while (ob_get_level()) ob_end_clean();

// Enable error reporting but log instead of display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set CORS and security headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');    // cache for 1 day
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
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