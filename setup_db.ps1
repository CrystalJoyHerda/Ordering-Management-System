Write-Host "Setting up database and user..." -ForegroundColor Green

# Path to MySQL executable (adjust if needed)
$mysqlPath = "C:\xampp\mysql\bin"

# First, try to create the user and database
Write-Host "Creating user and database..."
Get-Content ".\RESOURCES\create_user.sql" | & "$mysqlPath\mysql" -u root

if ($LASTEXITCODE -eq 0) {
    Write-Host "User and database created successfully" -ForegroundColor Green
    
    # Now import the database schema
    Write-Host "Importing database schema..."
    Get-Content ".\RESOURCES\employee_db.sql" | & "$mysqlPath\mysql" -u emp --password=emp employee_db
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema imported successfully" -ForegroundColor Green
        
        # Test the connection
        Write-Host "Testing connection..."
        $result = php test_db.php
        Write-Host $result
    } else {
        Write-Host "Error importing database schema" -ForegroundColor Red
    }
} else {
    Write-Host "Error creating user and database" -ForegroundColor Red
}
