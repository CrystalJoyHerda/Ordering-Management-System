@echo off
echo ========================================
echo    EMPLOYEE API SETUP FOR XAMPP
echo ========================================
echo.

echo Copying Employee API to XAMPP htdocs...
echo.

REM Check if XAMPP htdocs exists
if not exist "c:\xampp\htdocs" (
    echo ERROR: XAMPP htdocs directory not found at c:\xampp\htdocs
    echo Please make sure XAMPP is installed correctly.
    pause
    exit /b 1
)

REM Create Employee directory in htdocs if it doesn't exist
if not exist "c:\xampp\htdocs\Employee" (
    mkdir "c:\xampp\htdocs\Employee"
)

REM Copy the Employee folder contents
echo Copying files...
xcopy "c:\Ordering-Management-System\SOURCE CODE\Employee\*" "c:\xampp\htdocs\Employee\" /S /E /Y

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo         COPY COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Employee API is now available at:
    echo http://localhost/Employee/public/api/employee.php
    echo.
    echo Next steps:
    echo 1. Make sure XAMPP Apache and MySQL are running
    echo 2. Test the API at: http://localhost/Employee/public/api/employee.php
    echo 3. Open the Employee Management interface
    echo.
) else (
    echo.
    echo ERROR: Failed to copy files!
    echo Please check permissions and try again.
)

pause
