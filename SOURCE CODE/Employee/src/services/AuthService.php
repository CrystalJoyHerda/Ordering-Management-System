<?php
require_once __DIR__ . '/../config/database.php';

class AuthService {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function login($username, $password) {
        try {
            $query = "SELECT 
                        emp_id,
                        name,
                        role,
                        email,
                        created_at,
                        updated_at
                    FROM employees 
                    WHERE name = :username 
                    AND password_hash = SHA2(:password, 256)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $password);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                return [
                    'status' => 'success',
                    'data' => $user
                ];
            }
            
            return [
                'status' => 'error',
                'message' => 'Invalid username or password'
            ];
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}