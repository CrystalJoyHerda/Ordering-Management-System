<?php
require_once __DIR__ . '/BaseModel.php';

class EmployeeModel extends BaseModel {
    protected $table = 'employees';
    protected $primaryKey = 'emp_id';
    
    public function __construct() {
        parent::__construct();
    }
    
    // Custom method to create employee with password hashing
    public function createEmployee($data) {
        try {
            $this->conn->beginTransaction();
            
            // Hash password
            if (isset($data['password'])) {
                $data['password_hash'] = hash('sha256', $data['password']);
                unset($data['password']);
            }
            
            // Set default role if not provided
            if (!isset($data['role'])) {
                $data['role'] = 'staff';
            }
            
            $fields = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            
            $query = "INSERT INTO {$this->table} ($fields) VALUES ($placeholders)";
            $stmt = $this->conn->prepare($query);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            $stmt->execute();
            $id = $this->conn->lastInsertId();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Employee created successfully',
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
    
    // Get employees by role
    public function getByRole($role) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE role = :role";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role', $role);
            $stmt->execute();
            
            return [
                'status' => 'success',
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Update employee with password handling
    public function updateEmployee($id, $data) {
        try {
            $this->conn->beginTransaction();
            
            // Handle password update
            if (isset($data['password'])) {
                $data['password_hash'] = hash('sha256', $data['password']);
                unset($data['password']);
            }
            
            $setClause = '';
            foreach (array_keys($data) as $key) {
                $setClause .= "$key = :$key, ";
            }
            $setClause = rtrim($setClause, ', ');
            
            $query = "UPDATE {$this->table} SET $setClause, updated_at = CURRENT_TIMESTAMP WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id);
            
            $stmt->execute();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Employee updated successfully',
                'rows_affected' => $stmt->rowCount()
            ];
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}