<?php
// filepath: c:\xampp\htdocs\Employee\src\models\ProductModel.php

require_once 'BaseModel.php';

class ProductModel extends BaseModel {
    public function __construct() {
        parent::__construct();
        $this->table = 'products';
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
            
            // Prepare and execute query - ONLY USE EXISTING COLUMNS
            $query = "INSERT INTO {$this->table} (name, price, category) 
                      VALUES (:name, :price, :category)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':name', $data['name']);
            $stmt->bindValue(':price', $data['price']);
            $stmt->bindValue(':category', $data['category']);
            
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
            
            foreach ($filteredData as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            
            $stmt->execute();
            
            // Check if record exists
            if ($stmt->rowCount() === 0) {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Product not found or no changes made'
                ];
            }
            
            // Commit transaction
            $this->conn->commit();
            
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
            return [
                'status' => 'error',
                'message' => 'Failed to search products'
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
    public function getAllProducts() {
        try {
            $query = "SELECT * FROM {$this->table} ORDER BY id DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => $results
            ];
        } catch (PDOException $e) {
            error_log("Error getting products: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to load products'
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
}