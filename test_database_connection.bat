@echo off
echo ===========================================================
echo   Testing Database Connection for Ordering Management System
echo ===========================================================
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

REM Test connection with emp user
echo Testing connection with 'emp' user...
"%MYSQL_PATH%\mysql.exe" -h localhost -u emp -pemp -e "SELECT 'Connection successful!' AS Result;"

IF %errorlevel% NEQ 0 (
    echo.
    echo Connection failed with 'emp' user. Creating the user...
    
    REM Try to create the emp user
    "%MYSQL_PATH%\mysql.exe" -u root -e "CREATE USER IF NOT EXISTS 'emp'@'localhost' IDENTIFIED BY 'emp'; GRANT ALL PRIVILEGES ON employee_db.* TO 'emp'@'localhost'; FLUSH PRIVILEGES;"
    
    IF %errorlevel% NEQ 0 (
        echo Failed to create 'emp' user. Please run the setup_database.bat script first.
        pause
        exit /b 1
    ) ELSE (
        echo 'emp' user created successfully.
        echo Testing connection again...
        "%MYSQL_PATH%\mysql.exe" -h localhost -u emp -pemp -e "SELECT 'Connection successful!' AS Result;"
        
        IF %errorlevel% NEQ 0 (
            echo Connection still failed. Please check MySQL configuration.
            pause
            exit /b 1
        )
    )
)

echo.
echo Testing database access...
"%MYSQL_PATH%\mysql.exe" -h localhost -u emp -pemp -e "USE employee_db; SHOW TABLES;"

IF %errorlevel% NEQ 0 (
    echo Database access failed. The employee_db might not exist or 'emp' user lacks permissions.
    echo Please run the full setup_database.bat script.
    pause
    exit /b 1
)

echo.
echo Checking products table structure...
"%MYSQL_PATH%\mysql.exe" -h localhost -u emp -pemp -e "USE employee_db; DESCRIBE products;"

echo.
echo ======================================================
echo Database connection test completed!
echo.
echo Next steps:
echo 1. Start your web server (XAMPP, WAMP, etc.)
echo 2. Open http://localhost/Ordering-Management-System/SOURCE%%20CODE/SystemDesign/pages/inventory.html
echo ======================================================
pause
