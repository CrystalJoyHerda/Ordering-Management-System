<?php
// Debug script to test timezone issues
header('Content-Type: application/json');

// Test different timezone configurations
echo json_encode([
    'before_timezone_set' => [
        'date' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get(),
        'timestamp' => time()
    ]
]);

// Set timezone
date_default_timezone_set('Asia/Manila');

echo "\n";

echo json_encode([
    'after_timezone_set' => [
        'date' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get(),
        'timestamp' => time(),
        'formatted' => date('l, F j, Y g:i A')
    ]
]);

echo "\n";

// Show what the date would be for different queries
echo json_encode([
    'date_calculations' => [
        'today' => date('Y-m-d'),
        'yesterday' => date('Y-m-d', strtotime('-1 day')),
        'now_time' => date('H:i:s'),
        'utc_time' => gmdate('Y-m-d H:i:s'),
        'local_timestamp_formatted' => date('Y-m-d H:i:s', time())
    ]
]);
?>
