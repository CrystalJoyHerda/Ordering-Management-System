<?php
class Config {
    // Update API URLs to use direct paths
    public static $apiUrls = [
        'localhost' => 'http://localhost/SOURCE_CODE/Employee/public/api',
        'development' => 'http://localhost/SOURCE_CODE/Employee/public/api'
    ];
    
    // Update allowed origins
    public static $allowedOrigins = [
        'http://127.0.0.1:5501',
        'http://localhost:5501',
        'http://localhost',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ];
    
    // Update database config to match database.php
    public static $dbConfig = [
        'host' => 'localhost',
        'dbname' => 'employee_db',
        'username' => 'emp',
        'password' => 'emp'
    ];
    
    // Get current environment
    public static function getApiUrl() {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        return self::$apiUrls['localhost']; // Default to localhost
    }
    
    // Check if origin is allowed
    public static function isOriginAllowed($origin) {
        return in_array($origin, self::$allowedOrigins);
    }
}
?>
