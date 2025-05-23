<?php
// Clear any previous output and enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);
ob_clean();

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: http://127.0.0.1:5501');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours cache for preflight

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set JSON content type
header('Content-Type: application/json');

// Include required files
require_once '../../src/models/ProductModel.php';
require_once '../../src/middleware/RbacMiddleware.php';
require_once '../../src/config/cors.php';

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
            break;        case 'POST':
            // Only admin and manager can create products
            RbacMiddleware::requireRole(['admin', 'manager']);
            
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $product->createProduct($data);
            echo json_encode($result);
            break;

        case 'PUT':
            // Only admin and manager can update products
            RbacMiddleware::requireRole(['admin', 'manager']);
            
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
            break;        case 'DELETE':
            // Only admin can delete products
            RbacMiddleware::requireRole('admin');
            
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