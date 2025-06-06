-- Add contact_number and address fields to employees table
-- Run this script to add the missing columns for contact information

USE employee_db;

-- Add contact_number column
ALTER TABLE employees 
ADD COLUMN contact_number VARCHAR(15) DEFAULT NULL AFTER email;

-- Add address column  
ALTER TABLE employees
ADD COLUMN address TEXT DEFAULT NULL AFTER contact_number;

-- Verify the changes
DESCRIBE employees;

-- Optional: Update existing employees with sample data for testing
-- Uncomment the lines below if you want to add sample data
/*
UPDATE employees SET 
    contact_number = '09123456789',
    address = '123 Main Street, City'
WHERE emp_id = 1;

UPDATE employees SET 
    contact_number = '09234567890', 
    address = '456 Oak Avenue, Town'
WHERE emp_id = 2;

UPDATE employees SET
    contact_number = '09345678901',
    address = '789 Pine Road, Village' 
WHERE emp_id = 3;
*/
