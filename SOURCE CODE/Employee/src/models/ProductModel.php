<?php
require_once __DIR__ . '/BaseModel.php';

class ProductModel extends BaseModel {
    protected $table = 'products';
    protected $primaryKey = 'id';
    
    public function __construct() {
        parent::__construct();
    }
    
    public function getAll($limit = 100, $offset = 0) {
        try {
            // Add debug logging
            error_log("ProductModel::getAll - Starting query");
            
            $query = "SELECT id, name, price, category, created_at FROM {$this->table} LIMIT :limit OFFSET :offset";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("ProductModel::getAll - Found " . count($products) . " products");
            
            return [
                'status' => 'success',
                'data' => $products
            ];
        } catch (PDOException $e) {
            error_log("ProductModel::getAll - Error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function createProduct($data) {
        try {
            $this->conn->beginTransaction();
            
            $validFields = ['name', 'price', 'category'];
            $filteredData = array_intersect_key($data, array_flip($validFields));
            
            $fields = implode(', ', array_keys($filteredData));
            $placeholders = ':' . implode(', :', array_keys($filteredData));
            
            $query = "INSERT INTO {$this->table} ($fields) VALUES ($placeholders)";
            $stmt = $this->conn->prepare($query);
            
            foreach ($filteredData as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
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
    
    public function getById($id) {
        try {
            $query = "SELECT id, name, price, category, created_at FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
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
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function updateProduct($id, $data) {
        try {
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Validate input data
            $validFields = ['name', 'price', 'category'];
            $filteredData = array_intersect_key($data, array_flip($validFields));
            
            // Make sure we have data to update
            if (empty($filteredData)) {
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
            $stmt = $this->conn->prepare($query);
            
            // Bind all parameters
            foreach ($filteredData as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            
            $stmt->execute();
            
            // Check if the product exists
            if ($stmt->rowCount() === 0) {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Product not found or no changes made'
                ];
            }
            
            // Commit transaction
            $this->conn->commit();
            
            // Return success response
            return [
                'status' => 'success',
                'message' => 'Product updated successfully',
                'id' => $id
            ];
        } catch (PDOException $e) {
            // Roll back transaction on error
            $this->conn->rollBack();
            
            // Log and return error
            error_log("ProductModel::updateProduct - Error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function deleteProduct($id) {
        try {
            // Begin transaction
            $this->conn->beginTransaction();
            
            // Check if product exists
            $checkQuery = "SELECT 1 FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() === 0) {
                return [
                    'status' => 'error',
                    'message' => 'Product not found'
                ];
            }
            
            // Delete product
            $deleteQuery = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $deleteStmt->execute();
            
            // Commit transaction
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Product deleted successfully'
            ];
        } catch (PDOException $e) {
            // Roll back transaction on error
            $this->conn->rollBack();
            
            // Log and return error
            error_log("ProductModel::deleteProduct - Error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}