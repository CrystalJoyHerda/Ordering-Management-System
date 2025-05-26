<?php
// filepath: c:\xampp\htdocs\Employee\src\models\ProductModel.php

require_once 'BaseModel.php';

class ProductModel extends BaseModel {    public function __construct() {
        parent::__construct();
        $this->table = 'products';
        
        // Verify table exists
        try {
            $query = "DESCRIBE {$this->table}";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            // Ensure stock columns exist
            $this->ensureStockColumns();
            
        } catch (PDOException $e) {
            error_log("Products table verification failed: " . $e->getMessage());
            throw new Exception("Products table not found or inaccessible");
        }
    }
      public function createProduct($data) {
        try {
            $this->conn->beginTransaction();
            
            // Validate required fields
            if (!isset($data['name']) || !isset($data['price']) || !isset($data['category'])) {
                return [
                    'status' => 'error',
                    'message' => 'Missing required fields'
                ];
            }
              // Set default values for optional fields
            $status = isset($data['status']) ? $data['status'] : 'active';
            $description = isset($data['description']) ? $data['description'] : '';
            $image = isset($data['image']) ? $data['image'] : '../assets/images/logo.png';
            $stockQuantity = isset($data['stock_quantity']) ? (int)$data['stock_quantity'] : 0;
            $lowStockThreshold = isset($data['low_stock_threshold']) ? (int)$data['low_stock_threshold'] : 10;
            
            // Prepare and execute query - now includes stock columns
            $query = "INSERT INTO {$this->table} (name, price, category, status, description, image, stock_quantity, low_stock_threshold) 
                      VALUES (:name, :price, :category, :status, :description, :image, :stock_quantity, :low_stock_threshold)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':name', $data['name']);
            $stmt->bindValue(':price', $data['price']);
            $stmt->bindValue(':category', $data['category']);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':description', $description);
            $stmt->bindValue(':image', $image);
            $stmt->bindValue(':stock_quantity', $stockQuantity);
            $stmt->bindValue(':low_stock_threshold', $lowStockThreshold);
            
            $stmt->execute();
            $id = $this->conn->lastInsertId();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Product created successfully',
                'id' => $id
            ];
        } catch (PDOException $e) {
            $this->conn->rollBack();
            
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
      public function updateProduct($id, $data) {
        try {
            error_log("ProductModel::updateProduct called with ID: $id and data: " . print_r($data, true));
            
            // Begin transaction
            $this->conn->beginTransaction();
              // Validate input data - include all updateable fields including stock fields
            $validFields = ['name', 'price', 'category', 'status', 'description', 'image', 'stock_quantity', 'low_stock_threshold'];
            $filteredData = array_intersect_key($data, array_flip($validFields));
            
            error_log("Filtered data for update: " . print_r($filteredData, true));
            
            // Make sure we have data to update
            if (empty($filteredData)) {
                error_log("No valid fields to update");
                return [
                    'status' => 'error',
                    'message' => 'No valid fields to update'
                ];
            }
            
            // Build update statement
            $updates = [];
            foreach ($filteredData as $key => $value) {
                $updates[] = "$key = :$key";
            }
            
            // Prepare and execute query
            $query = "UPDATE {$this->table} SET " . implode(', ', $updates) . " WHERE {$this->primaryKey} = :id";
            error_log("Update query: $query");
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($filteredData as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
              $stmt->execute();
            
            $rowsAffected = $stmt->rowCount();
            error_log("Rows affected by update: $rowsAffected");
            
            // Check if record exists
            if ($rowsAffected === 0) {
                $this->conn->rollBack();
                error_log("Product not found or no changes made for ID: $id");
                return [
                    'status' => 'error',
                    'message' => 'Product not found or no changes made'
                ];
            }
            
            // Commit transaction
            $this->conn->commit();
            error_log("Product updated successfully with ID: $id");
            
            return [
                'status' => 'success',
                'message' => 'Product updated successfully',
                'id' => $id
            ];
        } catch (PDOException $e) {
            // Rollback transaction on error
            $this->conn->rollBack();
            
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function deleteProduct($id) {
        return $this->delete($id);
    }
    
    public function searchProducts($keyword, $category = null, $limit = 100, $offset = 0) {
        try {
            // Log the search parameters for debugging
            error_log("Searching for products - Keyword: {$keyword}, Category: {$category}, Limit: {$limit}, Offset: {$offset}");
            
            $query = "SELECT * FROM {$this->table} WHERE name LIKE :keyword";
            
            if ($category) {
                $query .= " AND category = :category";
            }
            
            $query .= " ORDER BY id DESC LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':keyword', "%{$keyword}%");
            
            if ($category) {
                $stmt->bindValue(':category', $category);
            }
            
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'count' => count($results),
                'data' => $results
            ];
        } catch (PDOException $e) {
            error_log("Error searching products: " . $e->getMessage());
            error_log("SQL Query: " . $query);
            return [
                'status' => 'error',
                'message' => 'Failed to search products: ' . $e->getMessage()
            ];
        }
    }
    
    public function getCategories() {
        try {
            $query = "SELECT DISTINCT category FROM {$this->table}";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            return [
                'status' => 'success',
                'count' => count($results),
                'data' => $results
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    // Add method to get all products for dashboard
    public function getById($id) {
        return $this->getProduct($id);
    }

    // Get all products for dashboard
    public function getAllProducts() {
        try {
            $this->conn->beginTransaction();
            
            // First check if table is accessible
            try {
                $checkQuery = "SELECT 1 FROM {$this->table} LIMIT 1";
                $this->conn->query($checkQuery);
            } catch (PDOException $e) {
                throw new Exception("Products table is not accessible: " . $e->getMessage());
            }
            
            // Get products with error handling
            $query = "SELECT * FROM {$this->table} ORDER BY id DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->conn->commit();
            
            if ($results === false) {
                throw new Exception("Failed to fetch products data");
            }
            
            return [
                'status' => 'success',
                'count' => count($results),
                'data' => $results
            ];
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Error getting products: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to load products: ' . $e->getMessage()
            ];
        }
    }
    
    // Add method to get single product
    public function getProduct($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return [
                    'status' => 'error',
                    'message' => 'Product not found'
                ];
            }
            
            return [
                'status' => 'success',
                'data' => $result
            ];
        } catch (PDOException $e) {
            error_log("Error getting product: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to load product'
            ];
        }
    }
      /**
     * Update stock for a product
     */
    public function updateStock($id, $data) {
        $transactionStarted = false;
        
        try {
            // Validate required fields first (before starting transaction)
            if (!isset($data['stock_quantity']) || !is_numeric($data['stock_quantity'])) {
                return [
                    'status' => 'error',
                    'message' => 'Valid stock quantity is required'
                ];
            }
            
            $stockQuantity = (int)$data['stock_quantity'];
            $reason = isset($data['reason']) ? $data['reason'] : 'ADJUSTMENT';
            $notes = isset($data['notes']) ? $data['notes'] : '';
            $updatedBy = isset($data['updated_by']) ? $data['updated_by'] : 1;
            
            // Start transaction
            $this->conn->beginTransaction();
            $transactionStarted = true;
            
            // First, check if the product exists and get current stock
            $checkQuery = "SELECT stock_quantity, low_stock_threshold FROM {$this->table} WHERE id = :id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindValue(':id', $id);
            $checkStmt->execute();
            $currentProduct = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentProduct) {
                if ($transactionStarted) {
                    $this->conn->rollBack();
                }
                return [
                    'status' => 'error',
                    'message' => 'Product not found'
                ];
            }
              $oldQuantity = $currentProduct['stock_quantity'] ?? 0;
            $lowStockThreshold = $currentProduct['low_stock_threshold'] ?? 5; // Get the product's low stock threshold
            $quantityChange = $stockQuantity - $oldQuantity;            // Determine appropriate status based on stock quantity and low stock threshold
            $newStatus = null;
            
            // Get current product status to check if it needs updating
            $currentQuery = "SELECT status FROM {$this->table} WHERE id = :id";
            $currentStmt = $this->conn->prepare($currentQuery);
            $currentStmt->bindValue(':id', $id);
            $currentStmt->execute();
            $currentStatus = $currentStmt->fetchColumn();
            
            if ($stockQuantity === 0) {
                $newStatus = 'inactive';
            } elseif ($stockQuantity <= $lowStockThreshold) {
                $newStatus = 'low';
            } elseif ($stockQuantity > $lowStockThreshold && ($currentStatus === 'inactive' || $currentStatus === 'low')) {
                // Reset to active when stock is replenished above threshold
                $newStatus = 'active';
            }
            
            // Update the product stock and status if needed
            if ($newStatus) {
                $updateQuery = "UPDATE {$this->table} SET stock_quantity = :stock_quantity, status = :status, updated_at = NOW() WHERE id = :id";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindValue(':stock_quantity', $stockQuantity);
                $updateStmt->bindValue(':status', $newStatus);
                $updateStmt->bindValue(':id', $id);
            } else {
                $updateQuery = "UPDATE {$this->table} SET stock_quantity = :stock_quantity, updated_at = NOW() WHERE id = :id";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindValue(':stock_quantity', $stockQuantity);
                $updateStmt->bindValue(':id', $id);
            }
            $updateStmt->execute();
            
            // Try to record stock history (create table if it doesn't exist)
            $historyTableExists = $this->createStockHistoryTableIfNotExists();
            
            // Only try to insert stock history if the table exists or was created
            if ($historyTableExists) {
                try {
                    $historyQuery = "INSERT INTO stock_history (product_id, old_quantity, new_quantity, quantity_change, reason, notes, updated_by, created_at) 
                                VALUES (:product_id, :old_quantity, :new_quantity, :quantity_change, :reason, :notes, :updated_by, NOW())";
                    $historyStmt = $this->conn->prepare($historyQuery);
                    $historyStmt->bindValue(':product_id', $id);
                    $historyStmt->bindValue(':old_quantity', $oldQuantity);
                    $historyStmt->bindValue(':new_quantity', $stockQuantity);
                    $historyStmt->bindValue(':quantity_change', $quantityChange);
                    $historyStmt->bindValue(':reason', $reason);
                    $historyStmt->bindValue(':notes', $notes);
                    $historyStmt->bindValue(':updated_by', $updatedBy);
                    $historyStmt->execute();
                } catch (PDOException $historyError) {
                    // Log the error but continue - stock update is more important than history
                    error_log("Failed to record stock history: " . $historyError->getMessage());
                }
            }
            
            $this->conn->commit();
            $transactionStarted = false;
            
            return [
                'status' => 'success',
                'message' => 'Stock updated successfully',
                'data' => [
                    'product_id' => $id,
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $stockQuantity,
                    'quantity_change' => $quantityChange
                ]
            ];
            
        } catch (PDOException $e) {
            if ($transactionStarted) {
                try {
                    $this->conn->rollBack();
                } catch (PDOException $rollbackError) {
                    error_log("Error during rollback: " . $rollbackError->getMessage());
                }
            }
            error_log("Error updating stock: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update stock: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get stock history for a product
     */
    public function getStockHistory($productId) {
        try {
            $this->createStockHistoryTableIfNotExists();
            
            $query = "SELECT sh.*, p.name as product_name 
                     FROM stock_history sh 
                     LEFT JOIN {$this->table} p ON sh.product_id = p.id 
                     WHERE sh.product_id = :product_id 
                     ORDER BY sh.created_at DESC 
                     LIMIT 50";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':product_id', $productId);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => $result
            ];
            
        } catch (PDOException $e) {
            error_log("Error getting stock history: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to load stock history'
            ];
        }
    }
    
    /**
     * Create stock history table if it doesn't exist
     */    private function createStockHistoryTableIfNotExists() {
        try {
            // First check if the table exists to avoid running DDL in a transaction
            $tableCheckQuery = "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'stock_history'";
            $tableCheckStmt = $this->conn->prepare($tableCheckQuery);
            $tableCheckStmt->execute();
            
            if ($tableCheckStmt->rowCount() > 0) {
                // Table exists, no need to create it
                return true;
            }
            
            // The table doesn't exist, so we need to create it
            // We're going to do this outside the transaction
            try {
                // Commit any pending transaction first
                if ($this->conn->inTransaction()) {
                    $this->conn->commit();
                }
                
                // Create the table
                $query = "CREATE TABLE IF NOT EXISTS stock_history (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    product_id INT NOT NULL,
                    old_quantity INT NOT NULL DEFAULT 0,
                    new_quantity INT NOT NULL DEFAULT 0,
                    quantity_change INT NOT NULL DEFAULT 0,
                    reason VARCHAR(50) NOT NULL DEFAULT 'ADJUSTMENT',
                    notes TEXT,
                    updated_by INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES {$this->table}(id) ON DELETE CASCADE
                )";
                
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                
                return true;
            } finally {
                // Start a new transaction to continue where we left off
                if (!$this->conn->inTransaction()) {
                    $this->conn->beginTransaction();
                }
            }
            
        } catch (PDOException $e) {
            error_log("Error creating stock_history table: " . $e->getMessage());
            // Log but don't throw - we'll try to continue without the history
            return false;
        }
    }
      /**
     * Ensure products table has stock columns
     */
    public function ensureStockColumns() {
        try {
            // Check existing columns first
            $stmt = $this->conn->prepare("DESCRIBE {$this->table}");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            
            // Add stock_quantity column if it doesn't exist
            if (!in_array('stock_quantity', $columns)) {
                $this->conn->exec("ALTER TABLE {$this->table} ADD COLUMN stock_quantity INT DEFAULT 0");
                error_log("Added stock_quantity column to {$this->table}");
            }
            
            // Add low_stock_threshold column if it doesn't exist
            if (!in_array('low_stock_threshold', $columns)) {
                $this->conn->exec("ALTER TABLE {$this->table} ADD COLUMN low_stock_threshold INT DEFAULT 10");
                error_log("Added low_stock_threshold column to {$this->table}");
            }
            
            // Add updated_at column if it doesn't exist
            if (!in_array('updated_at', $columns)) {
                $this->conn->exec("ALTER TABLE {$this->table} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                error_log("Added updated_at column to {$this->table}");
            }
            
            return true;
            
        } catch (PDOException $e) {
            error_log("Error adding stock columns: " . $e->getMessage());
            return false;
        }
    }
}