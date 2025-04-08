<?php
class Database {
    private $host = "localhost";
    private $database = "employee_db";
    private $username = "emp";
    private $password = "emp";
    private $conn;

    public function getConnection() {
        try {
            // Explicitly create connection with database name
            $dsn = "mysql:host={$this->host};dbname={$this->database}";
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "USE employee_db"
            ]);
            
            // Double check database selection
            $query = $this->conn->query("SELECT DATABASE()");
            $dbName = $query->fetchColumn();
            
            if ($dbName !== 'employee_db') {
                throw new PDOException("Wrong database selected: $dbName");
            }

            return $this->conn;
        } catch(PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            throw new PDOException("Connection failed: " . $e->getMessage());
        }
    }
}