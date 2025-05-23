-- Create the emp user and grant privileges
CREATE USER IF NOT EXISTS 'emp'@'localhost' IDENTIFIED BY 'emp';
GRANT ALL PRIVILEGES ON employee_db.* TO 'emp'@'localhost';
FLUSH PRIVILEGES;

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS employee_db;
USE employee_db;

-- Tables will be created by the employee_db.sql script
