@echo off
echo Checking URL accessibility...
echo.

REM Test if loginInterface.css is accessible
echo Testing CSS file access: http://127.0.0.1:5501/SOURCE%%20CODE/SystemDesign/css/loginInterface.css
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5501/SOURCE%%20CODE/SystemDesign/css/loginInterface.css' -UseBasicParsing; Write-Host ('Status: ' + $response.StatusCode + ' - SUCCESS'); } catch { Write-Host ('Error: ' + $_.Exception.Message) }"
echo.

REM Test if Live Server is running
echo Testing Live Server is running: http://127.0.0.1:5501
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5501' -UseBasicParsing; Write-Host ('Live Server running: ' + $response.StatusCode + ' - SUCCESS'); } catch { Write-Host ('Live Server error: ' + $_.Exception.Message) }"
echo.

REM Test if CORS headers are working on auth.php
echo Testing CORS headers on auth.php:
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/SOURCE_CODE/Employee/public/api/auth.php' -Method Options -UseBasicParsing; Write-Host ('CORS response: ' + $response.StatusCode + ' - SUCCESS'); foreach($header in $response.Headers) { if($header.Key -like 'Access-Control*') { Write-Host (' - ' + $header.Key + ': ' + $header.Value[0]) } } } catch { Write-Host ('CORS error: ' + $_.Exception.Message) }"

echo.
echo ===================================================================
echo If you see connection refused errors, make sure your servers are running:
echo.
echo 1. Live Server for frontend (VS Code extension)
echo 2. Apache/PHP server for backend (XAMPP/WAMP)
echo ===================================================================
pause
