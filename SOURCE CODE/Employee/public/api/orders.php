<?php
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

// Simple response function
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

try {
    // Include required files
    require_once '../../src/config/database.php';
    require_once '../../src/models/OrderModel.php';

    // Initialize order object
    $order = new OrderModel();

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['id'])) {
                $result = $order->getById($_GET['id']);
                sendResponse($result);
            } else if (isset($_GET['order_number'])) {
                $result = $order->getByOrderNumber($_GET['order_number']);
                sendResponse($result);
            } else {
                // Get all orders with optional filters
                $status = $_GET['status'] ?? null;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
                $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
                
                $result = $order->getAllOrders($status, $limit, $offset);
                sendResponse($result);
            }
            break;
        
        case 'POST':
            // Get raw input
            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true);
            
            // If JSON parsing failed, try to use $_POST
            if (json_last_error() !== JSON_ERROR_NONE) {
                $data = $_POST;
            }
            
            $result = $order->createOrder($data);
            sendResponse($result);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                sendResponse([
                    'status' => 'error',
                    'message' => 'Order ID is required'
                ], 400);
            }

            // Get raw input
            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true);
            
            // If JSON parsing failed, throw error
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendResponse([
                    'status' => 'error',
                    'message' => 'Invalid JSON data: ' . json_last_error_msg()
                ], 400);
            }
            
            $result = $order->updateOrder($_GET['id'], $data);
            sendResponse($result);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                sendResponse([
                    'status' => 'error',
                    'message' => 'Order ID is required'
                ], 400);
            }

            $result = $order->deleteOrder($_GET['id']);
            sendResponse($result);
            break;

        default:
            sendResponse([
                'status' => 'error',
                'message' => 'Method not allowed'
            ], 405);
    }
} catch (Exception $e) {
    // Log the error
    error_log("Orders API Error: " . $e->getMessage());
    
    sendResponse([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ], 500);
}
?>
