<?php
// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Determine the target API URL
$employeeApiPath = __DIR__ . '/../../Employee/public/api/employee.php';

// Check if employee API exists
if (!file_exists($employeeApiPath)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Employee API not found at: ' . $employeeApiPath
    ]);
    exit();
}

// Capture the request method and data
$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');
$queryString = $_SERVER['QUERY_STRING'] ?? '';

// Set up the context for the internal request
$context = stream_context_create([
    'http' => [
        'method' => $method,
        'header' => "Content-Type: application/json\r\n",
        'content' => $input
    ]
]);

// Build the internal URL
$internalUrl = 'http://localhost/Ordering-Management-System/SOURCE%20CODE/Employee/public/api/employee.php';
if (!empty($queryString)) {
    $internalUrl .= '?' . $queryString;
}

// Make the internal request
$response = @file_get_contents($internalUrl, false, $context);

if ($response === false) {
    // Fallback: try to include the file directly
    try {
        // Simulate the request environment
        $_SERVER['REQUEST_METHOD'] = $method;
        if (!empty($queryString)) {
            parse_str($queryString, $_GET);
        }
        
        // Capture output
        ob_start();
        include $employeeApiPath;
        $response = ob_get_clean();
        
        echo $response;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Proxy error: ' . $e->getMessage()
        ]);
    }
} else {
    // Forward the response
    echo $response;
}
?>
