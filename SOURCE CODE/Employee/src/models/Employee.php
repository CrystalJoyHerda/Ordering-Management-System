<?php
// filepath: c:\xampp\htdocs\Employee\src\models\Employee.php

require_once '../../src/config/database.php';

class Employee {
    // Database connection and table
    private $conn;
    private $table = 'employees';
    
    // Employee properties
    public $emp_id;
    public $name;
    public $role;
    public $password_hash;
    public $created_at;
    public $email;
    
    // Constructor with database connection
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Get all employees
    public function getAll() {
        try {
            $query = "SELECT emp_id, name, role, email, created_at FROM " . $this->table;
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            return false;
        }
    }
    
    // Get single employee by ID
    public function getById($id) {
        try {
            $query = "SELECT emp_id, name, role, created_at, email FROM " . $this->table . " WHERE emp_id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $employee = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$employee) {
                return [
                    'status' => 'error',
                    'message' => 'Employee not found'
                ];
            }
            
            return [
                'status' => 'success',
                'data' => $employee
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    // Create new employee
    public function create($data) {
        try {
            $this->conn->beginTransaction();
            
            // Validate required fields
            if (!isset($data['name']) || !isset($data['role']) || !isset($data['password'])) {
                return [
                    'status' => 'error',
                    'message' => 'Name, role, and password are required'
                ];
            }
            
            // Hash password
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Create query
            $query = "INSERT INTO " . $this->table . " (name, role, password_hash, email) VALUES 
                    (:name, :role, :password_hash, :email)";
            
            // Prepare statement
            $stmt = $this->conn->prepare($query);
            
            // Sanitize data
            $name = htmlspecialchars(strip_tags($data['name']));
            $role = htmlspecialchars(strip_tags($data['role']));
            $email = isset($data['email']) ? htmlspecialchars(strip_tags($data['email'])) : null;
            
            // Bind data
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':password_hash', $password_hash);
            $stmt->bindParam(':email', $email);
            
            // Execute query
            $stmt->execute();
            $emp_id = $this->conn->lastInsertId();
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Employee created successfully',
                'emp_id' => $emp_id
            ];
        } catch (PDOException $e) {
            $this->conn->rollBack();
            
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    // Update employee
    public function update($id, $data) {
        try {
            $this->conn->beginTransaction();
            
            // Create update query based on provided fields
            $updateFields = [];
            $params = [];
            
            if (isset($data['name'])) {
                $updateFields[] = "name = :name";
                $params[':name'] = htmlspecialchars(strip_tags($data['name']));
            }
            
            if (isset($data['role'])) {
                $updateFields[] = "role = :role";
                $params[':role'] = htmlspecialchars(strip_tags($data['role']));
            }
            
            if (isset($data['email'])) {
                $updateFields[] = "email = :email";
                $params[':email'] = htmlspecialchars(strip_tags($data['email']));
            }
            
            if (isset($data['password'])) {
                $updateFields[] = "password_hash = :password_hash";
                $params[':password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updateFields)) {
                return [
                    'status' => 'error',
                    'message' => 'No fields to update'
                ];
            }
            
            $query = "UPDATE " . $this->table . " SET " . implode(", ", $updateFields) . " WHERE emp_id = :id";
            $params[':id'] = $id;
            
            // Prepare statement
            $stmt = $this->conn->prepare($query);
            
            // Execute with parameters
            $stmt->execute($params);
            
            // Check if employee exists
            if ($stmt->rowCount() === 0) {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Employee not found or no changes made'
                ];
            }
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Employee updated successfully',
                'emp_id' => $id
            ];
        } catch (PDOException $e) {
            $this->conn->rollBack();
            
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    // Delete employee
    public function delete($id) {
        try {
            $this->conn->beginTransaction();
            
            // Create query
            $query = "DELETE FROM " . $this->table . " WHERE emp_id = :id";
            
            // Prepare statement
            $stmt = $this->conn->prepare($query);
            
            // Bind ID
            $stmt->bindParam(':id', $id);
            
            // Execute query
            $stmt->execute();
            
            // Check if employee exists
            if ($stmt->rowCount() === 0) {
                $this->conn->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Employee not found'
                ];
            }
            
            $this->conn->commit();
            
            return [
                'status' => 'success',
                'message' => 'Employee deleted successfully'
            ];
        } catch (PDOException $e) {
            $this->conn->rollBack();
            
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    // Login method
    public function login($name, $password) {
        try {
            // Find employee by name
            $query = "SELECT emp_id, name, role, password_hash, email FROM " . $this->table . " WHERE name = :name";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':name', $name);
            $stmt->execute();
            
            $employee = $stmt->fetch();
            
            // Check if employee exists
            if (!$employee) {
                return [
                    'status' => 'error',
                    'message' => 'Employee not found'
                ];
            }
            
            // Special case for admin (emp_id 5) with plaintext password
            if ($employee['name'] === 'admin') {
                if ($password !== $employee['password_hash']) {
                    return [
                        'status' => 'error',
                        'message' => 'Invalid password'
                    ];
                }
            } 
            // For other employees using SHA-256 hash
            else {
                $hashed_input = hash('sha256', $password);
                if ($hashed_input !== $employee['password_hash']) {
                    return [
                        'status' => 'error',
                        'message' => 'Invalid password'
                    ];
                }
            }
            
            // Remove password_hash from response
            unset($employee['password_hash']);
            
            return [
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $employee
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}
?>