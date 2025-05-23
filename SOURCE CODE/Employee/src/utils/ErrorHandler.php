<?php
// Enable error reporting
ini_set('display_errors', 0); // Don't show errors to users
error_reporting(E_ALL); // Report all types of errors

// Set up custom error handler
set_error_handler('customErrorHandler');
register_shutdown_function('fatalErrorHandler');

// Custom error handler function
function customErrorHandler($errno, $errstr, $errfile, $errline) {
    $logFile = __DIR__ . '/../../logs/error.log';
    
    // Create logs directory if it doesn't exist
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0777, true);
    }
    
    // Format the error message
    $errorType = getErrorType($errno);
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $errorType: $errstr in $errfile on line $errline\n";
    
    // Write to log file
    error_log($logMessage, 3, $logFile);
    
    // Don't execute PHP's internal error handler
    return true;
}

// Function to catch fatal errors
function fatalErrorHandler() {
    $error = error_get_last();
    
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        customErrorHandler($error['type'], $error['message'], $error['file'], $error['line']);
        
        // Send JSON response for API
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'A server error occurred. Please try again later.'
        ]);
    }
}

// Convert error number to text
function getErrorType($errno) {
    switch ($errno) {
        case E_ERROR:
            return 'Fatal Error';
        case E_WARNING:
            return 'Warning';
        case E_PARSE:
            return 'Parse Error';
        case E_NOTICE:
            return 'Notice';
        case E_CORE_ERROR:
            return 'Core Error';
        case E_CORE_WARNING:
            return 'Core Warning';
        case E_COMPILE_ERROR:
            return 'Compile Error';
        case E_COMPILE_WARNING:
            return 'Compile Warning';
        case E_USER_ERROR:
            return 'User Error';
        case E_USER_WARNING:
            return 'User Warning';
        case E_USER_NOTICE:
            return 'User Notice';
        case E_STRICT:
            return 'Strict Notice';
        case E_RECOVERABLE_ERROR:
            return 'Recoverable Error';
        case E_DEPRECATED:
            return 'Deprecated';
        case E_USER_DEPRECATED:
            return 'User Deprecated';
        default:
            return 'Unknown Error';
    }
}
