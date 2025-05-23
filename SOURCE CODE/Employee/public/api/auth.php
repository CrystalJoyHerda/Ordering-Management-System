<?php
// CORS headers - CRITICAL to be at the very top before any output
header("Access-Control-Allow-Origin: http://127.0.0.1:5501");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// Start output buffering
ob_start();

try {
    // Clear any output
    if (ob_get_length()) ob_clean();
    
    // Include database and Employee model
    require_once '../../src/config/database.php';
    require_once '../../src/models/Employee.php';
    require_once '../../src/utils/JwtHelper.php';

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

    // Get data from various sources
    $name = null;
    $password = null;
    
    // Check for JSON input
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $data = json_decode($rawInput, true);
        // If JSON parsing failed, try to parse as form data
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON parsing failed: " . json_last_error_msg());
            
            // Try to parse as query string (x-www-form-urlencoded)
            parse_str($rawInput, $formData);
            if (!empty($formData)) {
                $data = $formData;
                error_log("Parsed as form data: " . print_r($data, true));
            }
        }
        
        // Extract credentials from parsed data
        if (isset($data['name'])) {
            $name = $data['name'];
        } else if (isset($data['username'])) {
            $name = $data['username'];
        }
        
        if (isset($data['password'])) {
            $password = $data['password'];
        }
    }
    
    // Check POST data if not found in raw input
    if (empty($name) && isset($_POST['name'])) {
        $name = $_POST['name'];
    } else if (empty($name) && isset($_POST['username'])) {
        $name = $_POST['username'];
    }
    
    if (empty($password) && isset($_POST['password'])) {
        $password = $_POST['password'];
    }
    
    // Log what we received for debugging
    error_log("Credentials received - Name: " . (empty($name) ? "EMPTY" : $name) . ", Password: " . (empty($password) ? "EMPTY" : "[REDACTED]"));
    
    // Validate data
    if (empty($name) || empty($password)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Name and password are required',
            'debug' => [
                'raw_input' => $rawInput,
                'post' => $_POST
            ]
        ]);
        exit;
    }

    // Login user
    $result = $employee->login($name, $password);
    
    // If login is successful, generate JWT token
    if ($result['status'] === 'success') {
        try {
            // Use the JwtHelper to generate a proper JWT token
            $token = JwtHelper::generateToken($result['data']);
            $result['token'] = $token;
        } catch (Exception $e) {
            // Log the error
            error_log("JWT Error: " . $e->getMessage());
            
            // Fall back to simple token if JWT fails
            try {
                // Generate a simple token as fallback
                $payload = [
                    'iss' => 'ordering-system',
                    'iat' => time(),
                    'exp' => time() + 3600,
                    'data' => $result['data']
                ];
                
                // Base64 encode the payload
                $encodedPayload = base64_encode(json_encode($payload));
                
                // Create a simple token
                $token = 'SIMPLE.' . $encodedPayload . '.TOKEN';
                
                $result['token'] = $token;
                $result['jwt_fallback'] = true;
                $result['jwt_error'] = $e->getMessage();
            } catch (Exception $innerEx) {
                error_log("Token Fallback Error: " . $innerEx->getMessage());
                $result = [
                    'status' => 'error',
                    'message' => 'Authentication error: ' . $innerEx->getMessage()
                ];
            }
        }
    }

    // Return response
    ob_clean(); // Clear any output before sending response
    echo json_encode($result);
    exit; // Make sure we exit here
} catch (Exception $e) {
    // Handle any other exceptions
    error_log("Auth Exception: " . $e->getMessage());
    ob_clean();
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}