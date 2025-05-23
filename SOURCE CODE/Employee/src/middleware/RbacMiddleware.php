<?php
require_once __DIR__ . '/../utils/JwtHelper.php';

class RbacMiddleware {
    
    /**
     * Get authenticated user from Authorization header
     * @return object|null User data from token or null if not authenticated
     */
    public static function getAuthUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        return self::validateToken($token);
    }
    
    /**
     * Validate token (supports both JWT and simple tokens)
     * @param string $token The token to validate
     * @return object|null User data or null if invalid
     */
    private static function validateToken($token) {
        try {
            // First try to validate as JWT
            if (strpos($token, 'SIMPLE.') !== 0) {
                // Looks like a JWT token
                $result = JwtHelper::validateToken($token);
                if ($result['status'] === 'success') {
                    return (object)$result['data'];
                }
            }
            
            // Fall back to simple token validation
            $parts = explode('.', $token);
            
            if (count($parts) !== 3) {
                return null;
            }
            
            // Decode the payload
            $payload = json_decode(base64_decode($parts[1]));
            
            if (!$payload || !isset($payload->data)) {
                return null;
            }
            
            // Check expiration
            if (isset($payload->exp) && $payload->exp < time()) {
                return null;
            }
            
            return $payload->data;
        } catch (Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Check if user has required role
     * @param string|array $requiredRoles Single role or array of roles
     * @return boolean True if user has required role
     */
    public static function hasRole($requiredRoles) {
        $user = self::getAuthUser();
        
        if (!$user) {
            return false;
        }
        
        // Convert to array if string is provided
        if (!is_array($requiredRoles)) {
            $requiredRoles = [$requiredRoles];
        }
        
        return in_array($user->role, $requiredRoles);
    }
    
    /**
     * Enforce role requirement or return 403
     * @param string|array $requiredRoles Single role or array of roles
     * @return boolean True if user has required role
     */
    public static function requireRole($requiredRoles) {
        if (!self::hasRole($requiredRoles)) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Access denied: Insufficient permissions'
            ]);
            exit;
        }
        
        return true;
    }
}
