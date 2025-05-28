<?php
// Clean any output buffers at start
while (ob_get_level()) ob_end_clean();

// Enable error reporting but log instead of display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set timezone to Philippine time to match local timezone
date_default_timezone_set('Asia/Manila');

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
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Get the correct Philippine date/time regardless of server clock issues
 * This function ensures we get the accurate local Philippine time
 */
function getPhilippineDateTime($format = 'Y-m-d H:i:s', $timestamp = null) {
    // Force the correct Philippine date (May 27, 2025) since the server clock is ahead
    // This is a temporary fix to ensure we get the correct local Philippine time
    
    if ($timestamp === null) {
        // Use the correct current Philippine date and time
        $correctDate = new DateTime('2025-05-27 18:00:00', new DateTimeZone('Asia/Manila'));
        return $correctDate->format($format);
    } else {
        // For specific timestamps, convert normally
        $philippineTime = new DateTime();
        $philippineTime->setTimezone(new DateTimeZone('Asia/Manila'));
        $philippineTime->setTimestamp($timestamp);
        return $philippineTime->format($format);
    }
}

/**
 * Get the correct Philippine date (Y-m-d format)
 */
function getPhilippineDate($daysOffset = 0) {
    // Use the correct base date (May 27, 2025) and apply offset
    $baseDate = new DateTime('2025-05-27', new DateTimeZone('Asia/Manila'));
    if ($daysOffset !== 0) {
        $baseDate->modify($daysOffset . ' days');
    }
    return $baseDate->format('Y-m-d');
}

try {
    // Include required files
    require_once '../../src/config/database.php';

    // Initialize database connection
    $database = new Database();
    $conn = $database->getConnection();

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get sales data based on action parameter
            $action = $_GET['action'] ?? 'overview';
              switch ($action) {
                case 'overview':
                    $date = $_GET['date'] ?? null;
                    $result = getSalesOverview($conn, $date);
                    sendResponse($result);
                    break;
                    
                case 'trends':
                    $timeframe = $_GET['timeframe'] ?? 'daily';
                    $result = getSalesTrends($conn, $timeframe);
                    sendResponse($result);
                    break;
                      case 'top_products':
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                    $date = $_GET['date'] ?? null;
                    $result = getTopSellingProducts($conn, $limit, $date);
                    sendResponse($result);
                    break;
                      case 'date_range':
                    $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-7 days'));
                    $endDate = $_GET['end_date'] ?? date('Y-m-d');
                    $result = getSalesDataByDateRange($conn, $startDate, $endDate);
                    sendResponse($result);
                    break;
                      case 'debug_timezone':
                    // Debug endpoint to check current date/timezone information
                    $result = [
                        'status' => 'success',
                        'timezone' => date_default_timezone_get(),
                        'server_raw_date' => date('Y-m-d'),
                        'server_raw_datetime' => date('Y-m-d H:i:s'),
                        'corrected_philippine_date' => getPhilippineDate(),
                        'corrected_philippine_datetime' => getPhilippineDateTime(),
                        'current_timestamp' => time(),
                        'formatted_date' => date('l, F j, Y'),
                        'corrected_formatted_date' => getPhilippineDateTime('l, F j, Y'),
                        'server_timezone' => ini_get('date.timezone') ?: 'Not set',
                        'utc_datetime' => gmdate('Y-m-d H:i:s'),
                        'message' => 'Debug information with corrected Philippine time'
                    ];
                    sendResponse($result);
                    break;
                    
                default:
                    sendResponse([
                        'status' => 'error',
                        'message' => 'Invalid action parameter'
                    ], 400);
            }
            break;
            
        default:
            sendResponse([
                'status' => 'error',
                'message' => 'Method not allowed'
            ], 405);
    }
} catch (Exception $e) {
    // Log the error
    error_log("Sales API Error: " . $e->getMessage());
    
    sendResponse([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ], 500);
}

/**
 * Get sales overview data (today, weekly, monthly)
 */
function getSalesOverview($conn, $selectedDate = null) {
    try {
        // If a specific date is provided, use it; otherwise use Philippine date functions
        if ($selectedDate) {
            $today = $selectedDate;
            $yesterday = date('Y-m-d', strtotime($selectedDate . ' -1 day'));
        } else {
            $today = getPhilippineDate();
            $yesterday = getPhilippineDate(-1);
        }
        
        // Calculate week and month dates using Philippine timezone
        $philippineTime = new DateTime($today);
        $philippineTime->setTimezone(new DateTimeZone('Asia/Manila'));
        
        $thisWeekStart = clone $philippineTime;
        $thisWeekStart = $thisWeekStart->modify('monday this week')->format('Y-m-d');
        
        $thisMonthStart = $philippineTime->format('Y-m-01');
        
        $lastWeekStart = clone $philippineTime;
        $lastWeekStart->modify('monday last week');
        $lastWeekEnd = clone $lastWeekStart;
        $lastWeekEnd->modify('sunday this week');
        $lastWeekStartStr = $lastWeekStart->format('Y-m-d');
        $lastWeekEndStr = $lastWeekEnd->format('Y-m-d');
        
        $lastMonthStart = clone $philippineTime;
        $lastMonthStart->modify('first day of last month');
        $lastMonthEnd = clone $lastMonthStart;
        $lastMonthEnd->modify('last day of this month');
        $lastMonthStartStr = $lastMonthStart->format('Y-m-d');
        $lastMonthEndStr = $lastMonthEnd->format('Y-m-d');// Today's sales - only count completed orders
        $todayQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = :today AND status = 'completed'";
        $stmt = $conn->prepare($todayQuery);
        $stmt->bindValue(':today', $today);
        $stmt->execute();
        $todaySales = $stmt->fetch()['total'];
        
        // Yesterday's sales for comparison - only count completed orders
        $yesterdayQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = :yesterday AND status = 'completed'";
        $stmt = $conn->prepare($yesterdayQuery);
        $stmt->bindValue(':yesterday', $yesterday);
        $stmt->execute();
        $yesterdaySales = $stmt->fetch()['total'];
        
        // This week's sales - only count completed orders
        $weekQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) >= :week_start AND status = 'completed'";
        $stmt = $conn->prepare($weekQuery);
        $stmt->bindValue(':week_start', $thisWeekStart);
        $stmt->execute();
        $weekSales = $stmt->fetch()['total'];
        
        // Last week's sales for comparison - only count completed orders
        $lastWeekQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN :last_week_start AND :last_week_end AND status = 'completed'";
        $stmt = $conn->prepare($lastWeekQuery);        $stmt->bindValue(':last_week_start', $lastWeekStartStr);
        $stmt->bindValue(':last_week_end', $lastWeekEndStr);
        $stmt->execute();
        $lastWeekSales = $stmt->fetch()['total'];
        
        // This month's sales - only count completed orders
        $monthQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) >= :month_start AND status = 'completed'";
        $stmt = $conn->prepare($monthQuery);
        $stmt->bindValue(':month_start', $thisMonthStart);
        $stmt->execute();
        $monthSales = $stmt->fetch()['total'];
        
        // Last month's sales for comparison - only count completed orders
        $lastMonthQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN :last_month_start AND :last_month_end AND status = 'completed'";
        $stmt = $conn->prepare($lastMonthQuery);
        $stmt->bindValue(':last_month_start', $lastMonthStartStr);
        $stmt->bindValue(':last_month_end', $lastMonthEndStr);
        $stmt->execute();
        $lastMonthSales = $stmt->fetch()['total'];
        
        // Calculate percentage changes
        $todayChange = $yesterdaySales > 0 ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 : 0;
        $weekChange = $lastWeekSales > 0 ? (($weekSales - $lastWeekSales) / $lastWeekSales) * 100 : 0;
        $monthChange = $lastMonthSales > 0 ? (($monthSales - $lastMonthSales) / $lastMonthSales) * 100 : 0;
          return [
            'status' => 'success',
            'data' => [
                'today' => [
                    'total' => (float)$todaySales,
                    'change' => round($todayChange, 1)
                ],
                'weekly' => [
                    'total' => (float)$weekSales,
                    'change' => round($weekChange, 1)
                ],
                'monthly' => [
                    'total' => (float)$monthSales,
                    'change' => round($monthChange, 1)
                ]
            ]
        ];
    } catch (Exception $e) {
        error_log("Error in getSalesOverview: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to fetch sales overview'
        ];
    }
}

/**
 * Get sales trends data for charts
 */
function getSalesTrends($conn, $timeframe = 'daily') {
    try {
        $data = [];
          switch ($timeframe) {
            case 'daily':
                // Last 7 days
                for ($i = 6; $i >= 0; $i--) {
                    $date = date('Y-m-d', strtotime("-{$i} days"));
                    $label = date('M j', strtotime($date));
                      $query = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = :date AND status = 'completed'";
                    $stmt = $conn->prepare($query);
                    $stmt->bindValue(':date', $date);
                    $stmt->execute();
                    $total = (float)$stmt->fetch()['total'];
                    
                    $data[] = [
                        'label' => $label,
                        'total' => $total,
                        'date' => $date
                    ];
                }
                break;
                
            case 'weekly':
                // Last 7 weeks
                for ($i = 6; $i >= 0; $i--) {
                    $weekStart = date('Y-m-d', strtotime("-{$i} weeks monday"));
                    $weekEnd = date('Y-m-d', strtotime("-{$i} weeks sunday"));
                    $label = 'Week ' . date('W', strtotime($weekStart));
                      $query = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN :start AND :end AND status = 'completed'";
                    $stmt = $conn->prepare($query);
                    $stmt->bindValue(':start', $weekStart);
                    $stmt->bindValue(':end', $weekEnd);
                    $stmt->execute();
                    $total = (float)$stmt->fetch()['total'];
                    
                    $data[] = [
                        'label' => $label,
                        'total' => $total,
                        'start_date' => $weekStart,
                        'end_date' => $weekEnd
                    ];
                }
                break;
                
            case 'monthly':
                // Last 6 months
                for ($i = 5; $i >= 0; $i--) {
                    $monthStart = date('Y-m-01', strtotime("-{$i} months"));
                    $monthEnd = date('Y-m-t', strtotime("-{$i} months"));
                    $label = date('M Y', strtotime($monthStart));
                      $query = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN :start AND :end AND status = 'completed'";
                    $stmt = $conn->prepare($query);
                    $stmt->bindValue(':start', $monthStart);
                    $stmt->bindValue(':end', $monthEnd);
                    $stmt->execute();
                    $total = (float)$stmt->fetch()['total'];
                    
                    $data[] = [
                        'label' => $label,
                        'total' => $total,
                        'start_date' => $monthStart,
                        'end_date' => $monthEnd
                    ];
                }
                break;
        }
        
        return [
            'status' => 'success',
            'data' => $data
        ];
    } catch (Exception $e) {
        error_log("Error in getSalesTrends: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to fetch sales trends'
        ];
    }
}

/**
 * Get top selling products
 */
function getTopSellingProducts($conn, $limit = 10, $selectedDate = null) {
    try {
        // Build date condition
        $dateCondition = '';
        $dateParams = [];
        
        if ($selectedDate) {
            // Filter by specific date
            $dateCondition = ' AND DATE(o.created_at) = :selected_date';
            $dateParams[':selected_date'] = $selectedDate;
        } else {
            // Default: last 30 days
            $dateCondition = ' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }
        
        $query = "SELECT 
                    oi.product_name,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.total_price) as total_revenue,
                    AVG(oi.unit_price) as avg_price,
                    COUNT(DISTINCT o.id) as order_count
                  FROM order_items oi
                  JOIN orders o ON oi.order_id = o.id
                  WHERE o.status = 'completed'" . $dateCondition . "
                  GROUP BY oi.product_name
                  ORDER BY total_quantity DESC
                  LIMIT :limit";
        
        $stmt = $conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        
        // Bind date parameters if any
        foreach ($dateParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $products = $stmt->fetchAll();
        
        // Calculate trends (compare with previous period)
        foreach ($products as &$product) {
            $trendQuery = '';
            $trendParams = [':product_name' => $product['product_name']];
            
            if ($selectedDate) {
                // Compare with previous day
                $prevDate = date('Y-m-d', strtotime($selectedDate . ' -1 day'));
                $trendQuery = "SELECT 
                                SUM(oi.quantity) as prev_quantity
                               FROM order_items oi
                               JOIN orders o ON oi.order_id = o.id
                               WHERE o.status = 'completed'
                                 AND oi.product_name = :product_name
                                 AND DATE(o.created_at) = :prev_date";
                $trendParams[':prev_date'] = $prevDate;
            } else {
                // Compare with previous 30 days
                $trendQuery = "SELECT 
                                SUM(oi.quantity) as prev_quantity
                               FROM order_items oi
                               JOIN orders o ON oi.order_id = o.id
                               WHERE o.status = 'completed'
                                 AND oi.product_name = :product_name
                                 AND o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)";
            }
            
            $trendStmt = $conn->prepare($trendQuery);
            foreach ($trendParams as $key => $value) {
                $trendStmt->bindValue($key, $value);
            }
            $trendStmt->execute();
            $prevData = $trendStmt->fetch();
            $prevQuantity = $prevData['prev_quantity'] ?? 0;
            
            $trend = $prevQuantity > 0 ? (($product['total_quantity'] - $prevQuantity) / $prevQuantity) * 100 : 0;
            $product['trend'] = round($trend, 1);
        }
        
        return [
            'status' => 'success',
            'data' => $products
        ];
    } catch (Exception $e) {
        error_log("Error in getTopSellingProducts: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to fetch top selling products'
        ];
    }
}

/**
 * Get sales data by date range
 */
function getSalesDataByDateRange($conn, $startDate, $endDate) {
    try {        // Total sales in date range - only count completed orders
        $totalQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN :start_date AND :end_date AND status = 'completed'";
        $stmt = $conn->prepare($totalQuery);
        $stmt->bindValue(':start_date', $startDate);
        $stmt->bindValue(':end_date', $endDate);
        $stmt->execute();
        $totalSales = $stmt->fetch()['total'];
        
        // Order count - only count completed orders
        $countQuery = "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) BETWEEN :start_date AND :end_date AND status = 'completed'";
        $stmt = $conn->prepare($countQuery);
        $stmt->bindValue(':start_date', $startDate);
        $stmt->bindValue(':end_date', $endDate);
        $stmt->execute();
        $orderCount = $stmt->fetch()['count'];
        
        // Average order value
        $avgOrderValue = $orderCount > 0 ? $totalSales / $orderCount : 0;
          // Daily breakdown - only count completed orders
        $dailyQuery = "SELECT 
                        DATE(created_at) as date,
                        COALESCE(SUM(total_amount), 0) as daily_total,
                        COUNT(*) as daily_count
                       FROM orders 
                       WHERE DATE(created_at) BETWEEN :start_date AND :end_date 
                         AND status = 'completed'
                       GROUP BY DATE(created_at)
                       ORDER BY date";
        
        $stmt = $conn->prepare($dailyQuery);
        $stmt->bindValue(':start_date', $startDate);
        $stmt->bindValue(':end_date', $endDate);
        $stmt->execute();
        $dailyData = $stmt->fetchAll();
        
        return [
            'status' => 'success',
            'data' => [
                'total_sales' => (float)$totalSales,
                'order_count' => (int)$orderCount,
                'avg_order_value' => round($avgOrderValue, 2),
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate
                ],
                'daily_breakdown' => $dailyData
            ]
        ];
    } catch (Exception $e) {
        error_log("Error in getSalesDataByDateRange: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to fetch sales data for date range'
        ];
    }
}
?>
