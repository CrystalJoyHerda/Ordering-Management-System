<?php
// This is a simple router script for a PHP development server
// To use it, run: php -S localhost:8000 -t . server.php

// Get the requested URI
$uri = $_SERVER['REQUEST_URI'];

// Handle API requests
if (strpos($uri, '/api/') !== false) {
    // Let PHP handle the API requests
    return false;
}

// Get the file extension
$extension = pathinfo($uri, PATHINFO_EXTENSION);

// Set the correct MIME type for JavaScript files
if ($extension === 'js') {
    header('Content-Type: application/javascript');
}

// Check if the file exists
$file = __DIR__ . $uri;
if (is_file($file)) {
    // Serve the file directly
    return false;
}

// For HTML fallback, serve the relevant HTML file
if (!$extension && is_file($file . '.html')) {
    include $file . '.html';
    return true;
}

// If nothing matches, serve the request as-is
return false;
