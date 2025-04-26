<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Clear any previous output
ob_clean();

// Set CORS headers
header('Access-Control-Allow-Origin: http://127.0.0.1:5501');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Debug - Log request details
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Request URI: " . $_SERVER['REQUEST_URI']);

// Check if ProductModel.php exists
$modelPath = __DIR__ . '/../../src/models/ProductModel.php';
if (!file_exists($modelPath)) {
    error_log("ProductModel.php not found at: " . $modelPath);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: Model not found'
    ]);
    exit;
}

require_once $modelPath;

try {
    // Initialize product object
    $product = new ProductModel();

    // Get request method
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    // Check for method override (for PUT/DELETE)
    if ($requestMethod === 'POST' && isset($_GET['_method'])) {
        $requestMethod = $_GET['_method'];
    }

    // Handle request based on HTTP method
    switch ($requestMethod) {
        case 'GET':
            if (isset($_GET['id'])) {
                $result = $product->getById($_GET['id']);
                if (!$result) {
                    http_response_code(404);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Product not found'
                    ]);
                } else {
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                }
            } else {
                $products = $product->getAll();
                echo json_encode([
                    'status' => 'success',
                    'data' => $products
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $product->createProduct($data);
            echo json_encode($result);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Product ID is required'
                ]);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $result = $product->updateProduct($_GET['id'], $data);
            echo json_encode($result);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Product ID is required'
                ]);
                break;
            }

            $result = $product->deleteProduct($_GET['id']);
            echo json_encode($result);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'status' => 'error',
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    error_log("Error in products.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error'
    ]);
}
?>