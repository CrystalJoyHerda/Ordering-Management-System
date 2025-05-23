<?php
// filepath: c:\Ordering-Management-System\SOURCE CODE\SystemDesign\api\cors-proxy.php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Clear any previous output
ob_clean();

// Set CORS headers to allow all origins for development
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set the target URL - this is the API we want to proxy requests to
$targetUrl = 'http://localhost/Ordering-Management-System/SOURCE CODE/Employee/public/api/products.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Initialize cURL
$curl = curl_init();

// Forward all incoming data
$inputData = file_get_contents('php://input');

// Set cURL options
curl_setopt_array($curl, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_POSTFIELDS => $inputData
]);

// Add headers from original request
$requestHeaders = getallheaders();
$forwardHeaders = [];
foreach ($requestHeaders as $name => $value) {
    if ($name !== 'Host' && $name !== 'Origin' && $name !== 'Referer') {
        $forwardHeaders[] = "$name: $value";
    }
}
curl_setopt($curl, CURLOPT_HTTPHEADER, $forwardHeaders);

// Execute the request
$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);

// Check for errors
if (curl_errno($curl)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Proxy error: ' . curl_error($curl)
    ]);
} else {
    // Forward the response code and content type
    http_response_code($httpCode);
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    
    // Return the response
    echo $response;
}

// Close cURL resource
curl_close($curl);
