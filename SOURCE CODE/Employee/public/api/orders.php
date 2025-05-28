<?php
// Clean any output buffers at start
while (ob_get_level()) ob_end_clean();

// Enable error reporting but log instead of display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set timezone to Philippine time to match local timezone
date_default_timezone_set('Asia/Manila');

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

    // Log the request for debugging
    error_log("Orders API called - Method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Request body: " . file_get_contents('php://input'));

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['order_number'])) {
                $result = $order->getByOrderNumber($_GET['order_number']);
            } elseif (isset($_GET['id'])) {
                $result = $order->getById($_GET['id']);
            } else {
                // Get all orders with optional filters
                $status = $_GET['status'] ?? null;
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                $date = $_GET['date'] ?? null;
                
                $result = $order->getAllOrders($status, $limit, $offset, $date);
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
            break;        case 'PUT':
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
            
            // Check for order ID in data or URL
            $orderId = null;
            if (isset($data['id'])) {
                $orderId = $data['id'];
            } elseif (isset($_GET['id'])) {
                $orderId = $_GET['id'];
            }
            
            if (!$orderId) {
                sendResponse([
                    'status' => 'error',
                    'message' => 'Order ID is required in request body or URL'
                ], 400);
            }
            
            error_log("PUT request for order ID: " . $orderId);
            error_log("PUT data: " . json_encode($data));
            
            // Check if this is a simple status update
            if (isset($data['status']) && count($data) == 2) {
                error_log("Detected simple status update to: " . $data['status']);
                $result = $order->updateStatus($orderId, $data['status']);
            } else {
                error_log("Detected complex order update");
                $result = $order->updateOrder($orderId, $data);
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['id'])) {
                throw new Exception('Order ID is required for deletion');
            }
            $result = $order->deleteOrder($data['id']);
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
    
    error_log("API result: " . json_encode($result));
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
