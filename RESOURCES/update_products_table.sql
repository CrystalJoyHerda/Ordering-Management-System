-- SQL Script to update products table with necessary columns for inventory management
-- For Ordering-Management-System
-- Created: May 22, 2025

-- Add status column if it doesn't exist
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `status` ENUM('active', 'inactive', 'low') DEFAULT 'active' AFTER `category`;

-- Add description column if it doesn't exist
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `description` TEXT NULL AFTER `status`;

-- Add image column if it doesn't exist
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `image` VARCHAR(255) DEFAULT '../assets/images/logo.png' AFTER `description`;

-- Update existing products with default values
UPDATE `products` SET 
  `status` = 'active',
  `description` = CASE 
    WHEN `name` = 'Cappuccino' THEN 'Espresso with steamed milk and foam'
    WHEN `name` = 'Espresso' THEN 'Strong black coffee made by forcing steam through ground coffee beans'
    WHEN `name` = 'Cheesecake' THEN 'Dessert with a creamy filling and crust'
    WHEN `name` = 'Machiatto' THEN 'Espresso with a small amount of milk'
    ELSE 'Delicious coffee or pastry item'
  END,
  `image` = CASE
    WHEN `name` = 'Cappuccino' THEN '../assets/images/cappuccino.png'
    WHEN `name` = 'Espresso' THEN '../assets/images/espresso.png'
    WHEN `name` = 'Machiatto' THEN '../assets/images/logo.png'
    ELSE '../assets/images/logo.png'
  END
WHERE (`description` IS NULL OR `image` IS NULL);

-- Show the updated table structure
DESCRIBE `products`;

-- Show sample data to verify the update
SELECT * FROM `products` LIMIT 5;
