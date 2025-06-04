<?php
// Test order submission directly
header('Content-Type: application/json');

echo "=== Testing Order Submission ===\n";

// Test data that matches our frontend structure
$orderData = [
    'order_type' => 'dine-in',
    'customer_name' => null,
    'items' => [
        [
            'product_name' => 'Espresso',
            'product_id' => 1,
            'quantity' => 2,
            'unit_price' => 120.00,
            'total_price' => 240.00,
            'addons' => []
        ],
        [
            'product_name' => 'Americano',
            'product_id' => 3,
            'quantity' => 1,
            'unit_price' => 130.00,
            'total_price' => 130.00,
            'addons' => []
        ]
    ]
];

echo "Order data to submit:\n";
echo json_encode($orderData, JSON_PRETTY_PRINT) . "\n\n";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/SOURCE_CODE/Employee/public/api/orders.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

echo "Submitting order...\n";
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Response Code: $httpCode\n";
echo "Response: $response\n";

// Try to decode JSON response
$responseData = json_decode($response, true);
if ($responseData) {
    echo "Parsed Response:\n";
    echo json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Failed to parse JSON response\n";
}
?>
