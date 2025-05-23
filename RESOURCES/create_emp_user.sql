-- Create the 'emp' user if it doesn't exist
CREATE USER IF NOT EXISTS 'emp'@'localhost' IDENTIFIED BY 'emp';

-- Grant all privileges on employee_db to emp user
GRANT ALL PRIVILEGES ON employee_db.* TO 'emp'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;

-- Show the user was created
SELECT User, Host FROM mysql.user WHERE User = 'emp';
