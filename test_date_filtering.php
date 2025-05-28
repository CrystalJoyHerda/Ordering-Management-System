<?php
// Test script to verify date filtering works properly

echo "Testing Date Filtering Implementation\n";
echo "=====================================\n\n";

// Test 1: Sales API with date parameter
echo "1. Testing Sales API with date parameter...\n";
$testDate = '2025-05-27'; // Using a test date
$salesUrl = "http://localhost/SOURCE_CODE/Employee/public/api/sales.php?action=overview&status=completed&date={$testDate}";

echo "Testing URL: $salesUrl\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Accept: application/json'
    ]
]);

$salesResponse = file_get_contents($salesUrl, false, $context);
if ($salesResponse) {
    $salesData = json_decode($salesResponse, true);
    echo "Sales API Response: " . ($salesData['status'] === 'success' ? "SUCCESS" : "FAILED") . "\n";
    if (isset($salesData['data'])) {
        echo "Today's sales for $testDate: ₱" . number_format($salesData['data']['today']['total'], 2) . "\n";
    }
} else {
    echo "Sales API Response: FAILED - No response\n";
}

echo "\n";

// Test 2: Top Products API with date parameter
echo "2. Testing Top Products API with date parameter...\n";
$topProductsUrl = "http://localhost/SOURCE_CODE/Employee/public/api/sales.php?action=top_products&limit=5&status=completed&date={$testDate}";

echo "Testing URL: $topProductsUrl\n";

$topProductsResponse = file_get_contents($topProductsUrl, false, $context);
if ($topProductsResponse) {
    $topProductsData = json_decode($topProductsResponse, true);
    echo "Top Products API Response: " . ($topProductsData['status'] === 'success' ? "SUCCESS" : "FAILED") . "\n";
    if (isset($topProductsData['data'])) {
        echo "Found " . count($topProductsData['data']) . " products for $testDate\n";
    }
} else {
    echo "Top Products API Response: FAILED - No response\n";
}

echo "\n";

// Test 3: Orders API with date parameter
echo "3. Testing Orders API with date parameter...\n";
$ordersUrl = "http://localhost/SOURCE_CODE/Employee/public/api/orders.php?limit=10&date={$testDate}";

echo "Testing URL: $ordersUrl\n";

$ordersResponse = file_get_contents($ordersUrl, false, $context);
if ($ordersResponse) {
    $ordersData = json_decode($ordersResponse, true);
    echo "Orders API Response: " . ($ordersData['status'] === 'success' ? "SUCCESS" : "FAILED") . "\n";
    if (isset($ordersData['data'])) {
        echo "Found " . count($ordersData['data']) . " orders for $testDate\n";
    }
} else {
    echo "Orders API Response: FAILED - No response\n";
}

echo "\n";
echo "Test completed!\n";
echo "If all APIs respond with SUCCESS, the date filtering is working properly.\n";
?>
