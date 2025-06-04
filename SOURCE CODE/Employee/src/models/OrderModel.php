<?php

require_once 'BaseModel.php';

class OrderModel extends BaseModel {
    public function __construct() {
        parent::__construct();
        $this->table = 'orders';
        
        // Verify table exists
        try {
            $query = "DESCRIBE {$this->table}";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Orders table verification failed: " . $e->getMessage());
            throw new Exception("Orders table not found or inaccessible");
        }
    }

    public function createOrder($data) {
        try {
            $this->conn->beginTransaction();
            
            // Validate required fields
            if (!isset($data['order_type']) || !isset($data['items']) || !is_array($data['items'])) {
                return [
                    'status' => 'error',
                    'message' => 'Missing required fields: order_type and items array'
                ];
            }

            if (empty($data['items'])) {
                return [
                    'status' => 'error',
                    'message' => 'Order must contain at least one item'
                ];
            }

            // Generate unique order number
            $orderNumber = $this->generateOrderNumber();
            
            // Calculate total amount
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                if (!isset($item['quantity']) || !isset($item['unit_price'])) {
                    throw new Exception('Invalid item data: missing quantity or unit_price');
                }
                $totalAmount += $item['quantity'] * $item['unit_price'];
                
                // Add addon prices if present
                if (isset($item['addons']) && is_array($item['addons'])) {
                    foreach ($item['addons'] as $addon) {
                        if (isset($addon['price'])) {
                            $totalAmount += $addon['price'] * $item['quantity'];
                        }
                    }
                }
            }
            
            // Insert order
            $query = "INSERT INTO {$this->table} (order_number, order_type, total_amount, customer_name, status) 
                      VALUES (:order_number, :order_type, :total_amount, :customer_name, :status)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':order_number', $orderNumber);
            $stmt->bindValue(':order_type', $data['order_type']);
            $stmt->bindValue(':total_amount', $totalAmount);
            $stmt->bindValue(':customer_name', $data['customer_name'] ?? null);
            $stmt->bindValue(':status', 'pending');
            
            $stmt->execute();
            $orderId = $this->conn->lastInsertId();
            
            // Insert order items
            foreach ($data['items'] as $item) {
                $this->insertOrderItem($orderId, $item);
            }
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Order created successfully',
                'data' => [
                    'id' => $orderId,
                    'order_number' => $orderNumber,
                    'total_amount' => $totalAmount
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Create order error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to create order: ' . $e->getMessage()
            ];
        }
    }    private function insertOrderItem($orderId, $item) {
        // Resolve product_id if not provided but product_name is available
        $productId = $item['product_id'] ?? null;
        if (!$productId && isset($item['product_name'])) {
            $productId = $this->getProductIdByName($item['product_name']);
        }
        
        $query = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, addons) 
                  VALUES (:order_id, :product_id, :product_name, :quantity, :unit_price, :total_price, :addons)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':order_id', $orderId);
        $stmt->bindValue(':product_id', $productId);
        $stmt->bindValue(':product_name', $item['product_name']);
        $stmt->bindValue(':quantity', $item['quantity']);
        $stmt->bindValue(':unit_price', $item['unit_price']);
        
        // Use the total_price from frontend if provided, otherwise calculate
        if (isset($item['total_price'])) {
            $totalPrice = $item['total_price'];
        } else {
            // Calculate total price including addons
            $totalPrice = $item['quantity'] * $item['unit_price'];
            if (isset($item['addons']) && is_array($item['addons'])) {
                foreach ($item['addons'] as $addon) {
                    if (isset($addon['price'])) {
                        $totalPrice += $addon['price'] * $item['quantity'];
                    }
                }
            }
        }
        
        $stmt->bindValue(':total_price', $totalPrice);
        $stmt->bindValue(':addons', isset($item['addons']) ? json_encode($item['addons']) : null);
        
        $stmt->execute();
    }    private function generateOrderNumber() {
        $maxAttempts = 10;
        $attempts = 0;
        
        do {
            // Generate 3-digit order number (001-999)
            $orderNumber = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            
            // Check if this order number already exists
            $query = "SELECT COUNT(*) FROM {$this->table} WHERE order_number = :order_number";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':order_number', $orderNumber);
            $stmt->execute();
            $exists = $stmt->fetchColumn() > 0;
            
            $attempts++;
        } while ($exists && $attempts < $maxAttempts);
        
        if ($exists) {
            throw new Exception('Unable to generate unique order number');
        }
        
        return $orderNumber;
    }    public function getAllOrders($status = null, $limit = 50, $offset = 0, $date = null) {
        try {
            $query = "SELECT o.*, 
                      GROUP_CONCAT(
                          CONCAT(oi.product_name, ' (x', oi.quantity, ')')
                          SEPARATOR ', '
                      ) as items_summary
                      FROM {$this->table} o 
                      LEFT JOIN order_items oi ON o.id = oi.order_id";
            
            $params = [];
            $conditions = [];
            
            if ($status) {
                $conditions[] = "o.status = :status";
                $params[':status'] = $status;
            }
            
            if ($date) {
                $conditions[] = "DATE(o.created_at) = :date";
                $params[':date'] = $date;
            }
            
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(' AND ', $conditions);
            }
            
            $query .= " GROUP BY o.id ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $orders = $stmt->fetchAll();
            
            return [
                'status' => 'success',
                'data' => $orders
            ];
            
        } catch (Exception $e) {
            error_log("Get orders error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve orders: ' . $e->getMessage()
            ];
        }
    }

    public function getById($id) {
        try {
            // Get order details
            $query = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            $order = $stmt->fetch();
            
            if (!$order) {
                return [
                    'status' => 'error',
                    'message' => 'Order not found'
                ];
            }
            
            // Get order items
            $query = "SELECT * FROM order_items WHERE order_id = :order_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':order_id', $id);
            $stmt->execute();
            
            $items = $stmt->fetchAll();
            
            // Decode addons JSON for each item
            foreach ($items as &$item) {
                if ($item['addons']) {
                    $item['addons'] = json_decode($item['addons'], true);
                }
            }
            
            $order['items'] = $items;
            
            return [
                'status' => 'success',
                'data' => $order
            ];
            
        } catch (Exception $e) {
            error_log("Get order by ID error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve order: ' . $e->getMessage()
            ];
        }
    }    public function getByOrderNumber($orderNumber) {
        try {
            // Get order details
            $query = "SELECT * FROM {$this->table} WHERE order_number = :order_number";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':order_number', $orderNumber);
            $stmt->execute();
            
            $order = $stmt->fetch();
            
            if (!$order) {
                return [
                    'status' => 'error',
                    'message' => 'Order not found'
                ];
            }
            
            // Get order items
            $itemQuery = "SELECT oi.*, p.image as product_image 
                         FROM order_items oi
                         LEFT JOIN products p ON oi.product_id = p.id
                         WHERE oi.order_id = :order_id";
            $itemStmt = $this->conn->prepare($itemQuery);
            $itemStmt->bindValue(':order_id', $order['id']);
            $itemStmt->execute();
            $items = $itemStmt->fetchAll();
            
            // Parse addons JSON for each item
            foreach ($items as &$item) {
                if ($item['addons']) {
                    $item['addons'] = json_decode($item['addons'], true);
                } else {
                    $item['addons'] = [];
                }
            }
            
            // Add items to order object
            $order['items'] = $items;
            
            return [
                'status' => 'success',
                'order' => $order  // Changed from 'data' to 'order' to match frontend expectation
            ];
            
        } catch (Exception $e) {
            error_log("Get order by number error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve order: ' . $e->getMessage()
            ];
        }
    }    public function updateOrder($id, $data) {
        try {
            $this->conn->beginTransaction();
              // Handle simple status update (from receipt printing)
            if (isset($data['status']) && count($data) == 2 && isset($data['id'])) {
                // This is a simple status update - use the updateStatus method for consistency
                // and to ensure inventory deduction happens when status changes to 'completed'
                $this->conn->rollBack(); // Rollback the transaction started here
                return $this->updateStatus($id, $data['status']);
            }
            
            // Handle complete order update from cashier interface
            if (isset($data['items']) && isset($data['total_amount'])) {
                // This is a complete order update from cashier interface
                
                // Update order details
                $orderUpdateFields = [];
                $orderParams = [':id' => $id];
                
                if (isset($data['total_amount'])) {
                    $orderUpdateFields[] = "total_amount = :total_amount";
                    $orderParams[':total_amount'] = $data['total_amount'];
                }
                
                if (isset($data['order_type'])) {
                    $orderUpdateFields[] = "order_type = :order_type";
                    $orderParams[':order_type'] = $data['order_type'];
                }
                
                if (!empty($orderUpdateFields)) {
                    $orderQuery = "UPDATE {$this->table} SET " . implode(', ', $orderUpdateFields) . " WHERE id = :id";
                    $orderStmt = $this->conn->prepare($orderQuery);
                    
                    foreach ($orderParams as $key => $value) {
                        $orderStmt->bindValue($key, $value);
                    }
                    
                    $orderStmt->execute();
                }
                
                // Delete existing order items
                $deleteQuery = "DELETE FROM order_items WHERE order_id = :order_id";
                $deleteStmt = $this->conn->prepare($deleteQuery);
                $deleteStmt->bindValue(':order_id', $id);
                $deleteStmt->execute();
                
                // Insert new order items
                foreach ($data['items'] as $item) {
                    $this->insertOrderItem($id, $item);
                }
                
                $this->conn->commit();
                
                return [
                    'status' => 'success',
                    'message' => 'Order updated successfully'
                ];
                
            } else {
                // Original update method for simple field updates
                $allowedFields = ['status', 'customer_name'];
                $updateFields = [];
                $params = [':id' => $id];
                
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $updateFields[] = "{$field} = :{$field}";
                        $params[":{$field}"] = $data[$field];
                    }
                }
                
                if (empty($updateFields)) {
                    return [
                        'status' => 'error',
                        'message' => 'No valid fields to update'
                    ];
                }
                
                $query = "UPDATE {$this->table} SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                
                $stmt = $this->conn->prepare($query);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $this->conn->commit();
                    return [
                        'status' => 'success',
                        'message' => 'Order updated successfully'
                    ];
                } else {
                    $this->conn->rollBack();
                    return [
                        'status' => 'error',
                        'message' => 'Order not found or no changes made'
                    ];
                }
            }
            
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Update order error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update order: ' . $e->getMessage()
            ];
        }
    }

    // Add a dedicated method for status updates
    public function updateStatus($id, $status) {
        try {
            // Begin transaction to ensure atomicity
            $this->conn->beginTransaction();
            
            // Check if this is a status change to 'completed' to trigger inventory deduction
            $needsInventoryDeduction = false;
            if ($status === 'completed') {
                // Get current order status
                $currentStatusQuery = "SELECT status FROM {$this->table} WHERE id = :id";
                $currentStmt = $this->conn->prepare($currentStatusQuery);
                $currentStmt->bindValue(':id', $id);
                $currentStmt->execute();
                $currentStatus = $currentStmt->fetchColumn();
                
                // Only deduct inventory if status is changing to completed (not already completed)
                if ($currentStatus && $currentStatus !== 'completed') {
                    $needsInventoryDeduction = true;
                }
            }
            
            $query = "UPDATE {$this->table} SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
              if ($stmt->rowCount() > 0) {
                // If status changed to completed, attempt to deduct inventory
                $inventoryDeducted = false;
                if ($needsInventoryDeduction) {
                    $inventoryResult = $this->deductInventoryForOrder($id);
                    if ($inventoryResult['status'] === 'success') {
                        $inventoryDeducted = true;
                        error_log("Inventory successfully deducted for order {$id}");
                    } else {
                        // Log the inventory failure but don't fail the entire operation
                        // This allows legacy orders or orders with inventory issues to still be completed
                        error_log("Inventory deduction failed for order {$id}: " . $inventoryResult['message']);
                        error_log("Order status will still be updated to completed despite inventory issue");
                    }
                }
                
                $this->conn->commit();
                
                $responseMessage = 'Order status updated successfully';
                if ($inventoryDeducted) {
                    $responseMessage .= ' and inventory deducted';
                } elseif ($needsInventoryDeduction) {
                    $responseMessage .= ' (inventory deduction skipped due to errors)';
                }
                
                return [
                    'status' => 'success',
                    'message' => $responseMessage,
                    'data' => [
                        'id' => $id, 
                        'new_status' => $status,
                        'inventory_deducted' => $inventoryDeducted
                    ]
                ];
            } else {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Order not found or no changes made'
                ];
            }
            
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Update order status error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update order status: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Deduct inventory quantities for all items in an order
     * @param int $orderId The ID of the order
     * @return array Result of the inventory deduction process
     */
    private function deductInventoryForOrder($orderId) {
        try {
            // Get ProductModel instance for inventory operations
            require_once 'ProductModel.php';
            $productModel = new ProductModel();
            
            // Get order items
            $itemsQuery = "SELECT product_name, quantity FROM order_items WHERE order_id = :order_id";
            $itemsStmt = $this->conn->prepare($itemsQuery);
            $itemsStmt->bindValue(':order_id', $orderId);
            $itemsStmt->execute();
            $orderItems = $itemsStmt->fetchAll();
            
            if (empty($orderItems)) {
                return [
                    'status' => 'error',
                    'message' => 'No items found for order'
                ];
            }
            
            $deductionResults = [];
            $successCount = 0;
            $errorCount = 0;
            
            // Process each item
            foreach ($orderItems as $item) {
                $productName = $item['product_name'];
                $quantity = (int)$item['quantity'];
                
                // Get product ID by name
                $productId = $this->getProductIdByName($productName);
                
                if (!$productId) {
                    $errorCount++;
                    $deductionResults[] = [
                        'product_name' => $productName,
                        'quantity' => $quantity,
                        'status' => 'error',
                        'message' => 'Product not found in inventory'
                    ];
                    error_log("Inventory deduction: Product '{$productName}' not found");
                    continue;
                }
                
                // Get current stock quantity
                $stockQuery = "SELECT stock_quantity FROM products WHERE id = :id";
                $stockStmt = $this->conn->prepare($stockQuery);
                $stockStmt->bindValue(':id', $productId);
                $stockStmt->execute();
                $currentStock = $stockStmt->fetchColumn();
                
                if ($currentStock === false) {
                    $errorCount++;
                    $deductionResults[] = [
                        'product_name' => $productName,
                        'quantity' => $quantity,
                        'status' => 'error',
                        'message' => 'Could not retrieve current stock'
                    ];
                    continue;
                }
                
                $currentStock = (int)$currentStock;
                $newStock = max(0, $currentStock - $quantity); // Ensure stock doesn't go negative
                
                // Update stock using ProductModel's updateStock method
                $stockUpdateData = [
                    'stock_quantity' => $newStock,
                    'reason' => 'SOLD',
                    'notes' => "Order #{$orderId} completed - deducted {$quantity} units",
                    'updated_by' => 1 // System/auto deduction
                ];
                
                $updateResult = $productModel->updateStock($productId, $stockUpdateData);
                
                if ($updateResult['status'] === 'success') {
                    $successCount++;
                    $deductionResults[] = [
                        'product_name' => $productName,
                        'product_id' => $productId,
                        'quantity_deducted' => $quantity,
                        'old_stock' => $currentStock,
                        'new_stock' => $newStock,
                        'status' => 'success'
                    ];
                    error_log("Inventory deduction: {$productName} (ID: {$productId}) - deducted {$quantity}, stock: {$currentStock} → {$newStock}");
                } else {
                    $errorCount++;
                    $deductionResults[] = [
                        'product_name' => $productName,
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'status' => 'error',
                        'message' => $updateResult['message']
                    ];
                    error_log("Inventory deduction failed: {$productName} - " . $updateResult['message']);
                }
            }
            
            // Determine overall result
            if ($errorCount === 0) {
                return [
                    'status' => 'success',
                    'message' => "Successfully deducted inventory for {$successCount} items",
                    'details' => $deductionResults,
                    'summary' => [
                        'total_items' => count($orderItems),
                        'successful_deductions' => $successCount,
                        'failed_deductions' => $errorCount
                    ]
                ];
            } else if ($successCount > 0) {
                return [
                    'status' => 'partial_success',
                    'message' => "Partial success: {$successCount} items deducted, {$errorCount} failed",
                    'details' => $deductionResults,
                    'summary' => [
                        'total_items' => count($orderItems),
                        'successful_deductions' => $successCount,
                        'failed_deductions' => $errorCount
                    ]
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => "Failed to deduct inventory for all {$errorCount} items",
                    'details' => $deductionResults,
                    'summary' => [
                        'total_items' => count($orderItems),
                        'successful_deductions' => $successCount,
                        'failed_deductions' => $errorCount
                    ]
                ];
            }
            
        } catch (Exception $e) {
            error_log("Inventory deduction error for order {$orderId}: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to deduct inventory: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Auto-cancel pending orders that are older than the current date
     * @return array Result of the auto-cancellation process
     */    public function autoCancelOldPendingOrders() {
        try {
            // IMPORTANT: Do NOT change timezone here to avoid timezone mismatch issues
            // Use the same timezone context as when orders were created
            // If orders were created in local time, use local time for comparison
            // If orders were created in Manila time, use Manila time for comparison
            
            // Get current date in the same timezone context as the database
            // Check the database timezone setting first
            $timezoneQuery = "SELECT @@session.time_zone as session_tz, @@global.time_zone as global_tz";
            $tzStmt = $this->conn->prepare($timezoneQuery);
            $tzStmt->execute();
            $tzInfo = $tzStmt->fetch();
              // For consistency, we'll use the database's current date/time
            // This ensures the comparison uses the same timezone context
            $currentDateQuery = "SELECT CURDATE() as `current_date`, NOW() as `current_datetime`";
            $dateStmt = $this->conn->prepare($currentDateQuery);
            $dateStmt->execute();
            $dateInfo = $dateStmt->fetch();
            $currentDate = $dateInfo['current_date'];
            $currentDateTime = $dateInfo['current_datetime'];
            
            // Log the auto-cancellation attempt for debugging
            error_log("Auto-cancellation running at $currentDateTime with current date: $currentDate");
            error_log("Database timezone info - Session: {$tzInfo['session_tz']}, Global: {$tzInfo['global_tz']}");
              // Find pending orders that are older than today
            $findQuery = "SELECT id, order_number, created_at, total_amount 
                         FROM {$this->table} 
                         WHERE status = 'pending' 
                         AND DATE(created_at) < :current_date";
            
            $findStmt = $this->conn->prepare($findQuery);
            $findStmt->bindValue(':current_date', $currentDate);
            $findStmt->execute();
            $oldOrders = $findStmt->fetchAll();
            
            // Log which orders would be cancelled for debugging
            if (!empty($oldOrders)) {
                error_log("Auto-cancellation found " . count($oldOrders) . " old pending orders:");
                foreach ($oldOrders as $oldOrder) {
                    error_log("  - Order #{$oldOrder['order_number']} (ID: {$oldOrder['id']}) created at {$oldOrder['created_at']}");
                }
            } else {
                error_log("Auto-cancellation: No old pending orders found to cancel");
            }
            
            if (empty($oldOrders)) {
                return [
                    'status' => 'success',
                    'message' => 'No old pending orders found to cancel',
                    'cancelled_count' => 0,
                    'cancelled_orders' => []
                ];
            }
            
            $this->conn->beginTransaction();
            
            // Update the status of old pending orders to 'cancelled'
            $updateQuery = "UPDATE {$this->table} 
                           SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
                           WHERE status = 'pending' 
                           AND DATE(created_at) < :current_date";
            
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bindValue(':current_date', $currentDate);
            $updateStmt->execute();
            
            $cancelledCount = $updateStmt->rowCount();
            
            $this->conn->commit();
            
            // Log the auto-cancellation for audit purposes
            error_log("Auto-cancelled {$cancelledCount} old pending orders on {$currentDate}");
            
            return [
                'status' => 'success',
                'message' => "Successfully cancelled {$cancelledCount} old pending orders",
                'cancelled_count' => $cancelledCount,
                'cancelled_orders' => $oldOrders,
                'current_date' => $currentDate
            ];
            
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Auto-cancel old orders error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to auto-cancel old orders: ' . $e->getMessage()
            ];
        }
    }    private function getProductIdByName($productName) {
        try {
            $query = "SELECT id FROM products WHERE name = :name AND status != 'inactive' AND status != 'deleted'";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':name', $productName);
            $stmt->execute();
            
            $result = $stmt->fetch();
            return $result ? $result['id'] : null;
        } catch (Exception $e) {
            error_log("Error getting product ID by name: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Public wrapper for getProductIdByName for testing purposes
     * @param string $productName Name of the product
     * @return int|null Product ID or null if not found
     */
    public function getProductIdByNamePublic($productName) {
        return $this->getProductIdByName($productName);
    }
}
?>
