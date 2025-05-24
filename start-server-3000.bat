@echo off
echo Starting PHP Development Server on port 3000...
echo.
echo Server URL: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo Starting server in directory: %cd%
echo.
php -S localhost:3000 -t . server.php