<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Allow CORS for the live server
header("Access-Control-Allow-Origin: http://127.0.0.1:5501");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check for valid data
if (!isset($data['name']) || !isset($data['password'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Username and password are required'
    ]);
    exit();
}

// Forward the request to the actual auth endpoint
$api_url = 'http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api/auth.php';

// Initialize cURL session
$ch = curl_init($api_url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($input)
]);

// Execute cURL request
$response = curl_exec($ch);
$error = curl_error($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Close cURL session
curl_close($ch);

// Check for cURL errors
if ($error) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Connection error: ' . $error,
        'debug_info' => [
            'target_url' => $api_url,
            'input' => $data
        ]
    ]);
    exit();
}

// Forward the response
http_response_code($status);
echo $response;
?>
