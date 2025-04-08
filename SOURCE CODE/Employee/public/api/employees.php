<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../src/models/EmployeeModel.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check authentication
session_start();
if (!isset($_SESSION['user']) && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized access'
    ]);
    exit;
}

// Check admin role for sensitive operations
function checkAdminRole() {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Access forbidden: admin privileges required'
        ]);
        exit;
    }
}

$employeeModel = new EmployeeModel();

// Process request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get single employee or list
        if (isset($_GET['id'])) {
            $result = $employeeModel->getById($_GET['id']);
        } elseif (isset($_GET['role'])) {
            $result = $employeeModel->getByRole($_GET['role']);
        } else {
            $limit = $_GET['limit'] ?? 100;
            $offset = $_GET['offset'] ?? 0;
            $result = $employeeModel->getAll($limit, $offset);
        }
        
        echo json_encode($result);
        break;
        
    case 'POST':
        // Create new employee
        checkAdminRole(); // Only admins can create employees
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid input data'
            ]);
            break;
        }
        
        $result = $employeeModel->createEmployee($data);
        echo json_encode($result);
        break;
        
    case 'PUT':
        // Update employee
        checkAdminRole(); // Only admins can update employees
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Employee ID is required'
            ]);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid input data'
            ]);
            break;
        }
        
        $result = $employeeModel->updateEmployee($_GET['id'], $data);
        echo json_encode($result);
        break;
        
    case 'DELETE':
        // Delete employee
        checkAdminRole(); // Only admins can delete employees
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Employee ID is required'
            ]);
            break;
        }
        
        $result = $employeeModel->delete($_GET['id']);
        echo json_encode($result);
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
}