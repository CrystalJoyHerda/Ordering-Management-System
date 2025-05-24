<?php
// CORS headers MUST be first before any output
header("Access-Control-Allow-Origin: http://127.0.0.1:5501");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type after handling CORS
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log request details for debugging
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Request from origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'Unknown'));
error_log("Request headers: " . json_encode(getallheaders()));

// Start output buffering
ob_start();

try {
    // Include required files
    require_once '../../src/config/database.php';
    require_once '../../src/models/ProductModel.php';

    // Test parameter - just return success response
    if (isset($_GET['test'])) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Products API is working correctly',
            'paths' => [
                'document_root' => $_SERVER['DOCUMENT_ROOT'],
                'script_filename' => $_SERVER['SCRIPT_FILENAME'],
                'physical_path' => __FILE__
            ]
        ]);
        exit;
    }

    // Initialize product object
    $product = new ProductModel();

    // Get request method
    $requestMethod = $_SERVER['REQUEST_METHOD'];

    // Handle request based on HTTP method
    switch ($requestMethod) {
        case 'GET':
            if (isset($_GET['id'])) {
                $result = $product->getById($_GET['id']);
                echo json_encode($result);
            } else if (isset($_GET['search'])) {
                $keyword = $_GET['search'] ?? '';
                $category = $_GET['category'] ?? null;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
                $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
                
                $result = $product->searchProducts($keyword, $category, $limit, $offset);
                echo json_encode($result);
            } else {
                // Get all products
                $result = $product->getAllProducts();
                echo json_encode($result);
            }
            break;
        
        case 'POST':
            // Get raw input
            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true);
            
            // If JSON parsing failed, try to use $_POST
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON parsing failed: " . json_last_error_msg());
                $data = $_POST;
            }
            
            $result = $product->createProduct($data);
            echo json_encode($result);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Product ID is required'
                ]);
                break;
            }

            // Get raw input
            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true);
            
            // If JSON parsing failed, throw error
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON parsing failed: " . json_last_error_msg());
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON data: ' . json_last_error_msg()
                ]);
                break;
            }
            
            $result = $product->updateProduct($_GET['id'], $data);
            echo json_encode($result);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
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
    // Log the error
    error_log("Products API Error: " . $e->getMessage());
    
    // Clean output buffer
    if (ob_get_length()) ob_clean();
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>