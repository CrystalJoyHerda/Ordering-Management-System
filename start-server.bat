@echo off
echo Starting PHP Development Server...
echo.
echo Server URL: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
php -S localhost:8000 -t . server.php
