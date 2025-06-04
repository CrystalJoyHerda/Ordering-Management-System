@echo off
echo Testing PUT request to update order status...

echo {"id":90,"status":"completed"} > temp_data.json

curl -X PUT -H "Content-Type: application/json" -d @temp_data.json "http://localhost/SOURCE_CODE/Employee/public/api/orders.php"

echo.
echo.
echo Checking order status after update...

curl -X GET "http://localhost/SOURCE_CODE/Employee/public/api/orders.php?order_number=987"

del temp_data.json
pause
