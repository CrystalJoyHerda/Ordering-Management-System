<?php
// Clean any output buffers at start
while (ob_get_level()) ob_end_clean();

// Enable error reporting but log instead of display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set CORS and security headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');    // cache for 1 day
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// Simple response function
function sendResponse($status, $data = null, $message = null) {
    echo json_encode([
        'status' => $status,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Database connection
try {
    require_once '../../src/config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    sendResponse('error', null, 'Database connection failed');
}

// Check if connection is successful
if (!$conn) {
    sendResponse('error', null, 'Database connection failed');
}

// Handle GET request only
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse('error', null, 'Only GET method allowed');
}

/**
 * Get cashier dashboard data
 */
function getDashboardData($conn) {
    try {
        $today = date('Y-m-d');
        
        // Get today's orders count and sales total
        $todayQuery = "SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as sales_total 
            FROM orders 
            WHERE DATE(created_at) = :today 
            AND status != 'cancelled'";
        
        $stmt = $conn->prepare($todayQuery);
        $stmt->bindValue(':today', $today);
        $stmt->execute();
        $todayStats = $stmt->fetch();
        
        // Get recent orders (last 10 orders)
        $recentOrdersQuery = "SELECT 
            o.id as order_id,
            o.created_at,
            o.total_amount,
            o.status,
            GROUP_CONCAT(
                CONCAT(oi.quantity, 'x ', oi.product_name) 
                ORDER BY oi.id 
                SEPARATOR ', '
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE DATE(o.created_at) = :today
            GROUP BY o.id, o.created_at, o.total_amount, o.status
            ORDER BY o.created_at DESC
            LIMIT 10";
        
        $stmt = $conn->prepare($recentOrdersQuery);
        $stmt->bindValue(':today', $today);
        $stmt->execute();
        $recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format recent orders data
        $formattedOrders = [];
        foreach ($recentOrders as $order) {
            $formattedOrders[] = [
                'order_id' => $order['order_id'],
                'time' => date('H:i', strtotime($order['created_at'])),
                'items' => $order['items'] ?: 'No items',
                'total' => number_format($order['total_amount'], 2),
                'status' => ucfirst($order['status'])
            ];
        }
        
        return [
            'today_stats' => [
                'orders_count' => (int)$todayStats['orders_count'],
                'sales_total' => number_format($todayStats['sales_total'], 2)
            ],
            'recent_orders' => $formattedOrders
        ];
        
    } catch (PDOException $e) {
        error_log("Dashboard data error: " . $e->getMessage());
        return null;
    }
}

// Get dashboard data
$dashboardData = getDashboardData($conn);

if ($dashboardData === null) {
    sendResponse('error', null, 'Failed to fetch dashboard data');
}

// Send successful response
sendResponse('success', $dashboardData, 'Dashboard data retrieved successfully');
?>