# XAMPP Setup Instructions for Order Management System

## Prerequisites
1. XAMPP installed and running
2. Apache and MySQL services started in XAMPP Control Panel

## Step 1: Copy Project to htdocs
Copy your entire `Ordering-Management-System` folder to:
```
C:\xampp\htdocs\Ordering-Management-System
```

## Step 2: Create Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create a new database named `employee_db`
3. Import the database structure by running the SQL file:
   - Go to the Import tab
   - Choose file: `RESOURCES/employee_db.sql`
   - Click "Go" to import

## Step 3: Test Database Connection
Open this URL in your browser to test the connection:
```
http://localhost/Ordering-Management-System/test_xampp_connection.php
```

You should see a JSON response indicating successful database connection and table status.

## Step 4: Test the Menu Interface
1. Start your Live Server extension on the menu interface file
2. When customers place orders, they will now be saved to the database
3. Order numbers will be generated (001, 002, 003, etc.)

## Step 5: Test Cashier Order Lookup
1. Open the cashier interface
2. Use the order lookup feature with order numbers from the database
3. Cashiers can now retrieve real customer orders

## File Paths Updated for XAMPP:
- Menu Interface API: `http://localhost/Ordering-Management-System/SOURCE%20CODE/Employee/public/api/orders.php`
- Database Config: Updated to use root/empty password (XAMPP default)

## Troubleshooting:
1. If you get database connection errors, check:
   - MySQL service is running in XAMPP
   - Database `employee_db` exists
   - Tables are imported correctly

2. If you get CORS errors:
   - Make sure the API files have proper CORS headers (already included)
   - Access menu interface through Live Server, not file:// protocol

3. If orders aren't saving:
   - Check browser console for JavaScript errors
   - Verify the API URL is accessible: http://localhost/Ordering-Management-System/SOURCE%20CODE/Employee/public/api/orders.php
