<?php

require_once 'BaseModel.php';

class AddonModel extends BaseModel {
    public function __construct() {
        parent::__construct();
        $this->table = 'addons';
        
        // Verify table exists
        try {
            $query = "DESCRIBE {$this->table}";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Addons table verification failed: " . $e->getMessage());
            throw new Exception("Addons table not found or inaccessible");
        }
    }

    public function createAddon($data) {
        try {
            // Validate required fields
            if (!isset($data['name']) || !isset($data['price'])) {
                return [
                    'status' => 'error',
                    'message' => 'Missing required fields: name and price'
                ];
            }
            
            // Set default values for optional fields
            $category = isset($data['category']) ? $data['category'] : 'general';
            $status = isset($data['status']) ? $data['status'] : 'active';
            
            // Prepare and execute query
            $query = "INSERT INTO {$this->table} (name, price, category, status) 
                      VALUES (:name, :price, :category, :status)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':name', $data['name']);
            $stmt->bindValue(':price', $data['price']);
            $stmt->bindValue(':category', $category);
            $stmt->bindValue(':status', $status);
            
            $stmt->execute();
            $id = $this->conn->lastInsertId();
            
            return [
                'status' => 'success',
                'message' => 'Addon created successfully',
                'data' => ['id' => $id]
            ];
            
        } catch (Exception $e) {
            error_log("Create addon error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to create addon: ' . $e->getMessage()
            ];
        }
    }

    public function getAllAddons($category = null) {
        try {
            $query = "SELECT * FROM {$this->table}";
            $params = [];
            
            if ($category) {
                $query .= " WHERE category = :category";
                $params[':category'] = $category;
            }
            
            $query .= " AND status = 'active' ORDER BY category, name";
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            $addons = $stmt->fetchAll();
            
            return [
                'status' => 'success',
                'data' => $addons
            ];
            
        } catch (Exception $e) {
            error_log("Get addons error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve addons: ' . $e->getMessage()
            ];
        }
    }

    public function getById($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            $addon = $stmt->fetch();
            
            if ($addon) {
                return [
                    'status' => 'success',
                    'data' => $addon
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Addon not found'
                ];
            }
            
        } catch (Exception $e) {
            error_log("Get addon by ID error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve addon: ' . $e->getMessage()
            ];
        }
    }

    public function updateAddon($id, $data) {
        try {
            $allowedFields = ['name', 'price', 'category', 'status'];
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
                    'message' => 'Addon updated successfully'
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Addon not found or no changes made'
                ];
            }
            
        } catch (Exception $e) {
            error_log("Update addon error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update addon: ' . $e->getMessage()
            ];
        }
    }

    public function deleteAddon($id) {
        try {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return [
                    'status' => 'success',
                    'message' => 'Addon deleted successfully'
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Addon not found'
                ];
            }
            
        } catch (Exception $e) {
            error_log("Delete addon error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to delete addon: ' . $e->getMessage()
            ];
        }
    }
}
?>
