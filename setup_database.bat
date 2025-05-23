@echo off
echo ======================================================
echo    Setting up database for Ordering Management System
echo ======================================================
echo.

REM Check if MySQL path exists
SET MYSQL_PATH=C:\xampp\mysql\bin
IF NOT EXIST "%MYSQL_PATH%\mysql.exe" SET MYSQL_PATH=C:\wamp64\bin\mysql\mysql5.7.36\bin
IF NOT EXIST "%MYSQL_PATH%\mysql.exe" SET MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin
IF NOT EXIST "%MYSQL_PATH%\mysql.exe" (
    echo MySQL not found. Please install XAMPP, WAMP or MySQL first.
    echo You can modify this script to point to your MySQL installation path.
    pause
    exit /b 1
)

echo Using MySQL from: %MYSQL_PATH%
echo.

REM Create the database if it doesn't exist
echo Creating database if it doesn't exist...
"%MYSQL_PATH%\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS employee_db;"
if %errorlevel% neq 0 (
    echo Error creating database. Please check MySQL is running.
    pause
    exit /b 1
)

REM Create the emp user
echo Creating emp user...
"%MYSQL_PATH%\mysql.exe" -u root < "%~dp0RESOURCES\create_emp_user.sql"
if %errorlevel% neq 0 (
    echo Error creating emp user. Continuing with root...
)

REM Import the base schema
echo Importing base schema...
"%MYSQL_PATH%\mysql.exe" -u root employee_db < "%~dp0RESOURCES\employee_db.sql"
if %errorlevel% neq 0 (
    echo Error importing base schema.
    pause
    exit /b 1
)

REM Add the missing columns
echo Adding status and description columns...
"%MYSQL_PATH%\mysql.exe" -u emp -pemp employee_db < "%~dp0RESOURCES\update_products_table.sql"
if %errorlevel% neq 0 (
    echo Error updating table structure. Trying with root user...
    "%MYSQL_PATH%\mysql.exe" -u root employee_db < "%~dp0RESOURCES\update_products_table.sql"
    if %errorlevel% neq 0 (
        echo Error updating table structure.
        pause
        exit /b 1
    )
)

echo.
echo Database setup completed successfully!
echo.
echo You should now be able to run your application with the following:
echo 1. Start your web server (XAMPP, WAMP, etc.)
echo 2. Open http://localhost/Ordering-Management-System/SOURCE%%20CODE/SystemDesign/pages/inventory.html
echo.
echo ======================================================
pause
