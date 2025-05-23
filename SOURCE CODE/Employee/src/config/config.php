<?php
class Config {
    // Base URLs for different environments
    public static $apiUrls = [
        'localhost' => 'http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api',
        'liveserver' => 'http://localhost/SOURCE_CODE_SYSTEM/Employee/public/api'
    ];
    
    // CORS allowed origins
    public static $allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1:5501',
        'http://localhost:5501'
    ];
    
    // Database config
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
