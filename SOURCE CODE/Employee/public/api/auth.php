<?php
// Disable error reporting for notices
error_reporting(E_ALL & ~E_NOTICE);

// Clear any existing output buffers
while (ob_get_level()) {
    @ob_end_clean();
}

// Set CORS and security headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start fresh output buffer
ob_start();

// Check if file exists before including
$docRoot = $_SERVER['DOCUMENT_ROOT'];
$requiredFiles = [
    '/SOURCE_CODE/Employee/src/config/database.php',
    '/SOURCE_CODE/Employee/src/models/Employee.php',
    '/SOURCE_CODE/Employee/src/utils/JwtHelper.php'
];

foreach ($requiredFiles as $file) {
    if (!file_exists($docRoot . $file)) {
        error_log("Missing required file: " . $docRoot . $file);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Server configuration error']);
        exit();
    }
}

try {
    ob_clean();
    
    require_once $docRoot . '/SOURCE_CODE/Employee/src/config/database.php';
    require_once $docRoot . '/SOURCE_CODE/Employee/src/models/Employee.php';
    require_once $docRoot . '/SOURCE_CODE/Employee/src/utils/JwtHelper.php';

    // Initialize employee object
    $employee = new Employee();

    // Accept both POST and GET methods
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed. Use POST or GET.',
            'method' => $_SERVER['REQUEST_METHOD']
        ]);
        exit;
    }

    // Get data from various sources
    $name = null;
    $password = null;
    $format = $_REQUEST['format'] ?? 'json'; // Get format from either GET or POST
    
    // Check request method and parse accordingly
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request parameters
        $name = $_GET['name'] ?? ($_GET['username'] ?? null);
        $password = $_GET['password'] ?? null;
        
        error_log("GET Auth Request - Name: " . ($name ?? "EMPTY") . ", Source: " . ($_SERVER['HTTP_REFERER'] ?? "DIRECT"));
    } else {
        // Handle POST request - check for JSON input
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
    }
    
    // Log what we received for debugging
    error_log("Credentials received - Name: " . (empty($name) ? "EMPTY" : $name) . ", Password: " . (empty($password) ? "EMPTY" : "[REDACTED]"));
    
    // Validate data
    if (empty($name) || empty($password)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Name and password are required',
            'debug' => [
                'method' => $_SERVER['REQUEST_METHOD'],
                'got_name' => !empty($name),
                'got_password' => !empty($password),
                'request_data' => $_SERVER['REQUEST_METHOD'] === 'GET' ? $_GET : $_POST
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

    // Ensure clean output
    while (ob_get_level()) {
        @ob_end_clean();
    }
    
    // Send the response
    echo json_encode($result);
    exit;
    
} catch (Exception $e) {
    // Handle any other exceptions
    error_log("Auth Exception: " . $e->getMessage());
    
    // Ensure clean output
    while (ob_get_level()) {
        @ob_end_clean();
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}