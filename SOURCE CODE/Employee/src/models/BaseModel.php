<?php
// filepath: c:\xampp\htdocs\Employee\src\models\BaseModel.php


require_once __DIR__ . '/../config/database.php';

class BaseModel {
    protected $conn;
    protected $table;
    protected $primaryKey = 'id';
    
    public function __construct() {
        // Make sure this matches the actual class name in your database.php file
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Get all records
    public function getAll() {
        try {
            $query = "SELECT * FROM {$this->table}";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    // Get record by ID
    public function getById($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return [
                    'status' => 'error',
                    'message' => 'Record not found'
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
    
    // Delete record
    public function delete($id) {
        try {
            $this->conn->beginTransaction();
            
            $query = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Record not found'
                ];
            }
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Record deleted successfully'
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
?>