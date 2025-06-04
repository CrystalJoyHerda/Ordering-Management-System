#!/bin/bash
# Simple script to test the PUT request
echo "Testing PUT request to update order status..."

curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"id":90,"status":"completed"}' \
  "http://localhost/SOURCE_CODE/Employee/public/api/orders.php"

echo -e "\n\nChecking order status after update..."

curl -X GET "http://localhost/SOURCE_CODE/Employee/public/api/orders.php?order_number=987"
