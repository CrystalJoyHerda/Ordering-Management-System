<?php
// Example of how to load environment variables

// Require the Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Load environment variables from .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Now you can access your environment variables using $_ENV or getenv()
$dbHost = $_ENV['DB_HOST'] ?? 'default_host';
$dbName = $_ENV['DB_NAME'] ?? 'default_db_name';
$dbUser = $_ENV['DB_USER'] ?? 'default_user';
$dbPass = $_ENV['DB_PASS'] ?? 'default_password';

// Access vendor configuration
$vendorName = $_ENV['VENDOR_NAME'] ?? 'unknown';
$vendorVersion = $_ENV['VENDOR_VERSION'] ?? 'unknown';

// Access tokens
$jwtSecret = $_ENV['JWT_SECRET'] ?? 'default_secret';
$apiToken = $_ENV['API_TOKEN'] ?? 'default_token';

// Example usage
echo "Database Connection Info: $dbHost, $dbName, $dbUser\n";
echo "Vendor Info: $vendorName version $vendorVersion\n";
echo "JWT Secret: $jwtSecret\n";
echo "API Token: $apiToken\n";
