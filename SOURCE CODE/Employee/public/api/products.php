<?php
// filepath: c:\xampp\htdocs\Employee\public\api\products.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get the requesting origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Set proper CORS headers for credentials
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://127.0.0.1:5500"); // Use specific origin, not wildcard
header('Access-Control-Allow-Credentials: true'); // Required for cookies/auth
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

require_once '../../src/models/ProductModel.php';

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For testing - force a session user
session_start();
if (!isset($_SESSION['user'])) {
    $_SESSION['user'] = [
        'role' => 'admin',
        'name' => 'Test User'
    ];
}

// Log request for debugging
error_log("products.php - Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("products.php - Query params: " . json_encode($_GET));
error_log("products.php - Input data: " . file_get_contents('php://input'));

$productModel = new ProductModel();

// Check for method override
$requestMethod = $_SERVER['REQUEST_METHOD'];
if ($requestMethod === 'POST' && isset($_GET['_method']) && $_GET['_method'] === 'PUT') {
    $requestMethod = 'PUT';
}

// Process request based on method
switch ($requestMethod) {
    case 'GET':
        // Get single product or list
        if (isset($_GET['id'])) {
            $result = $productModel->getById($_GET['id']);
        } else {
            $limit = $_GET['limit'] ?? 100;
            $offset = $_GET['offset'] ?? 0;
            error_log("products.php - Getting all products, limit: $limit, offset: $offset");
            $result = $productModel->getAll($limit, $offset);
        }
        
        error_log("products.php - Result: " . json_encode($result));
        echo json_encode($result);
        break;
        
    case 'POST':
        // Create new product
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid input data'
            ]);
            break;
        }
        
        $result = $productModel->createProduct($data);
        echo json_encode($result);
        break;
        
    case 'PUT':
        error_log("products.php - PUT request received");
        error_log("products.php - Query params: " . json_encode($_GET));
        error_log("products.php - Input data: " . file_get_contents('php://input'));

        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Product ID is required']);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Log decoded data
        error_log("products.php - Decoded input data: " . json_encode($data));
        
        $result = $productModel->updateProduct($_GET['id'], $data);
        echo json_encode($result);
        break;
        
    case 'DELETE':
        // Delete product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Product ID is required'
            ]);
            break;
        }
        
        $result = $productModel->deleteProduct($_GET['id']);
        echo json_encode($result);
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
}