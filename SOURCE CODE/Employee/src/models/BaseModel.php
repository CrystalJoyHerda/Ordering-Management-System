<?php
require_once __DIR__ . '/../config/database.php';

abstract class BaseModel {
    protected $conn;
    protected $table;
    protected $primaryKey = 'id';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll($limit = 100, $offset = 0) {
        try {
            $query = "SELECT * FROM {$this->table} LIMIT :limit OFFSET :offset";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
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
    
    public function getById($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
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
    
    public function create($data) {
        try {
            $this->conn->beginTransaction();
            
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
                'message' => 'Record created successfully',
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
    
    public function update($id, $data) {
        try {
            $this->conn->beginTransaction();
            
            $setClause = '';
            foreach (array_keys($data) as $key) {
                $setClause .= "$key = :$key, ";
            }
            $setClause = rtrim($setClause, ', ');
            
            $query = "UPDATE {$this->table} SET $setClause WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id);
            
            $stmt->execute();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Record updated successfully',
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
    
    public function delete($id) {
        try {
            $this->conn->beginTransaction();
            
            $query = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Record deleted successfully',
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