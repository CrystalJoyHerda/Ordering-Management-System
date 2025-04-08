<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../src/services/AuthService.php';

// Initialize session
session_start();

// Route based on action
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
        
    case 'logout':
        handleLogout();
        break;
        
    case 'check':
        checkSession();
        break;
        
    default:
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action'
        ]);
}

function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
        return;
    }
    
    try {
        // Get and validate JSON input
        $jsonInput = file_get_contents('php://input');
        if (!$jsonInput) {
            throw new Exception('No input received');
        }

        $data = json_decode($jsonInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON format: ' . json_last_error_msg());
        }

        // Validate required fields
        if (empty($data['username']) || empty($data['password'])) {
            throw new Exception('Username and password are required');
        }

        // Initialize auth service
        $auth = new AuthService();
        $result = $auth->login($data['username'], $data['password']);

        if ($result['status'] === 'success') {
            // Set session variables
            $_SESSION['user'] = $result['data'];
            $_SESSION['last_activity'] = time();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $result['data']
            ]);
        } else {
            throw new Exception($result['message']);
        }
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

function handleLogout() {
    // Destroy session
    session_unset();
    session_destroy();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Logout successful'
    ]);
}

function checkSession() {
    // Check if user is logged in
    if (isset($_SESSION['user'])) {
        // Check for session timeout (30 minutes)
        $sessionTimeout = 30 * 60; // 30 minutes in seconds
        
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $sessionTimeout)) {
            // Session expired
            session_unset();
            session_destroy();
            
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Session expired',
                'logged_in' => false
            ]);
        } else {
            // Update last activity time
            $_SESSION['last_activity'] = time();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Session active',
                'logged_in' => true,
                'user' => $_SESSION['user']
            ]);
        }
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Not logged in',
            'logged_in' => false
        ]);
    }
}