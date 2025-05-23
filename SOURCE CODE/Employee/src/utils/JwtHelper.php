<?php
// For debugging
error_log("JwtHelper.php is being loaded");

// Load Composer's autoloader - corrected path
$autoloaderPath = __DIR__ . '/../../../../vendor/autoload.php';
if (!file_exists($autoloaderPath)) {
    error_log("JWT Autoloader not found at: " . $autoloaderPath);
    throw new Exception("Autoloader not found at: " . $autoloaderPath);
}
require_once $autoloaderPath;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper {
    private static $secret_key = 'your_secret_key_change_this_in_production'; // Change this in production!
    private static $algorithm = 'HS256';
    private static $issuer = 'ordering-system';
      /**
     * Generate JWT token for a user
     * @param array $userData User data to include in the token
     * @return string JWT token
     */
    public static function generateToken($userData) {
        try {
            $issuedAt = time();
            $expiration = $issuedAt + 3600; // Token valid for 1 hour
            
            $payload = [
                'iss' => self::$issuer,
                'iat' => $issuedAt,
                'exp' => $expiration,
                'data' => [
                    'emp_id' => $userData['emp_id'] ?? null,
                    'name' => $userData['name'] ?? null,
                    'role' => $userData['role'] ?? 'employee', // Include role for RBAC
                    'email' => $userData['email'] ?? null
                ]
            ];
            
            return JWT::encode($payload, self::$secret_key, self::$algorithm);
        } catch (\Exception $e) {
            error_log("JWT Generate Error: " . $e->getMessage());
            throw $e; // Re-throw to be handled by the caller
        }
    }
    
    /**
     * Validate JWT token
     * @param string $token JWT token to validate
     * @return array Status and user data
     */
    public static function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, self::$algorithm));
            return [
                'status' => 'success',
                'data' => $decoded->data
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}
