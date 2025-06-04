# Test script to update order status
$requestBody = @{
    id = 90
    status = "completed"
} | ConvertTo-Json

Write-Host "Request body: $requestBody"

try {
    $response = Invoke-RestMethod -Uri "http://localhost/SOURCE_CODE/Employee/public/api/orders.php" -Method PUT -Body $requestBody -ContentType "application/json"
    Write-Host "Update response: $response"
} catch {
    Write-Host "Error updating order: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}

# Check the order status after update
try {
    $checkResponse = Invoke-RestMethod -Uri "http://localhost/SOURCE_CODE/Employee/public/api/orders.php?order_number=987" -Method GET
    Write-Host "Order status check: $checkResponse"
} catch {
    Write-Host "Error checking order: $($_.Exception.Message)"
}
