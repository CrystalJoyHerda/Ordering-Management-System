<?php
// Test monthly API response
header('Content-Type: application/json');

// Include the sales API file
include 'SOURCE CODE/Employee/public/api/sales.php';

// Test the monthly trends
try {
    $response = getSalesTrends($conn, 'monthly');
    echo json_encode($response, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
}
?>
