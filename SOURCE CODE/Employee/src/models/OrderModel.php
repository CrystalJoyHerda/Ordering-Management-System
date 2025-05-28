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
    }

    public function getAllOrders($status = null, $limit = 50, $offset = 0) {
        try {
            $query = "SELECT o.*, 
                      GROUP_CONCAT(
                          CONCAT(oi.product_name, ' (x', oi.quantity, ')')
                          SEPARATOR ', '
                      ) as items_summary
                      FROM {$this->table} o 
                      LEFT JOIN order_items oi ON o.id = oi.order_id";
            
            $params = [];
            
            if ($status) {
                $query .= " WHERE o.status = :status";
                $params[':status'] = $status;
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
                
                $query = "UPDATE {$this->table} SET " . implode(', ', $updateFields) . " WHERE id = :id";
                
                $stmt = $this->conn->prepare($query);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    return [
                        'status' => 'success',
                        'message' => 'Order updated successfully'
                    ];
                } else {
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

    public function deleteOrder($id) {
        try {
            $this->conn->beginTransaction();
            
            // Delete order items first (due to foreign key constraint)
            $query = "DELETE FROM order_items WHERE order_id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            // Delete order
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $this->conn->commit();
                return [
                    'status' => 'success',
                    'message' => 'Order deleted successfully'
                ];
            } else {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Order not found'
                ];
            }
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Delete order error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to delete order: ' . $e->getMessage()
            ];
        }
    }

    private function getProductIdByName($productName) {
        try {
            $query = "SELECT id FROM products WHERE name = :name AND status = 'active'";
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
}
?>
