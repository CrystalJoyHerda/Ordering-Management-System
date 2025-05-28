@echo off
echo =====================================
echo Sales History Database Connection Test
echo =====================================
echo.

echo [1/3] Checking XAMPP Services...
netstat -an | find "3306" >nul
if %errorlevel% == 0 (
    echo ✅ MySQL service is running on port 3306
) else (
    echo ❌ MySQL service not detected. Please start XAMPP.
    pause
    exit /b 1
)

netstat -an | find "80" >nul
if %errorlevel% == 0 (
    echo ✅ Apache service is running on port 80
) else (
    echo ❌ Apache service not detected. Please start XAMPP.
    pause
    exit /b 1
)

echo.
echo [2/3] Checking API Files...
if exist "C:\xampp\htdocs\SOURCE_CODE\Employee\public\api\sales.php" (
    echo ✅ Sales API file found
) else (
    echo ❌ Sales API file not found in htdocs
    echo Expected location: C:\xampp\htdocs\SOURCE_CODE\Employee\public\api\sales.php
    pause
    exit /b 1
)

echo.
echo [3/3] Opening Test Page...
echo Opening Sales API test page in your default browser...
start "" "http://localhost/Ordering-Management-System/test_sales_api.html"

echo.
echo =====================================
echo Test Instructions:
echo 1. Test each API endpoint using the buttons
echo 2. If tests fail, check XAMPP and database
echo 3. If tests pass, your Sales History page is ready!
echo =====================================
pause
