-- SQL Script to Add Stock Tracking to Products Table
-- For Ordering-Management-System Inventory Management
-- Created: May 25, 2025

-- Add stock quantity column to products table
ALTER TABLE `products` 
ADD COLUMN `stock_quantity` INT(11) NOT NULL DEFAULT 100 AFTER `image`,
ADD COLUMN `min_stock_level` INT(11) NOT NULL DEFAULT 10 AFTER `stock_quantity`,
ADD COLUMN `last_restocked` TIMESTAMP NULL DEFAULT NULL AFTER `min_stock_level`;

-- Update existing products with default stock values
UPDATE `products` SET 
  `stock_quantity` = CASE 
    WHEN `category` = 'coffee' THEN 50
    WHEN `category` = 'beverages' THEN 30
    WHEN `category` = 'pastries' THEN 25
    WHEN `category` = 'sandwiches' THEN 15
    WHEN `category` = 'cakes' THEN 10
    ELSE 20
  END,
  `min_stock_level` = CASE 
    WHEN `category` = 'coffee' THEN 10
    WHEN `category` = 'beverages' THEN 5
    WHEN `category` = 'pastries' THEN 5
    WHEN `category` = 'sandwiches' THEN 3
    WHEN `category` = 'cakes' THEN 2
    ELSE 5
  END,
  `last_restocked` = CURRENT_TIMESTAMP
WHERE `stock_quantity` = 100; -- Only update products that still have default values

-- Update status based on stock levels
UPDATE `products` SET 
  `status` = CASE 
    WHEN `stock_quantity` = 0 THEN 'inactive'
    WHEN `stock_quantity` <= `min_stock_level` THEN 'low'
    ELSE 'active'
  END;

-- Create index for stock queries
CREATE INDEX `idx_products_stock` ON `products` (`stock_quantity`);
CREATE INDEX `idx_products_min_stock` ON `products` (`min_stock_level`);

-- Create a view for low stock products
CREATE VIEW `low_stock_products` AS
SELECT 
    id,
    name,
    category,
    stock_quantity,
    min_stock_level,
    (min_stock_level - stock_quantity) as shortage,
    status,
    last_restocked
FROM `products` 
WHERE `stock_quantity` <= `min_stock_level` 
   OR `stock_quantity` = 0
ORDER BY `stock_quantity` ASC, `category`;

-- Create a stock history table for tracking stock changes
CREATE TABLE `stock_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `change_type` enum('restock','sale','adjustment','return') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `old_quantity` int(11) NOT NULL,
  `new_quantity` int(11) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_stock_history_product` (`product_id`),
  KEY `idx_stock_history_date` (`created_at`),
  KEY `idx_stock_history_type` (`change_type`),
  CONSTRAINT `fk_stock_history_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert initial stock history for existing products
INSERT INTO `stock_history` (`product_id`, `change_type`, `quantity_change`, `old_quantity`, `new_quantity`, `notes`, `created_by`)
SELECT 
    id,
    'restock',
    stock_quantity,
    0,
    stock_quantity,
    'Initial stock setup',
    'system'
FROM `products`;

-- Create stored procedure for updating stock
DELIMITER $$
CREATE PROCEDURE `UpdateProductStock`(
    IN p_product_id INT,
    IN p_quantity_change INT,
    IN p_change_type ENUM('restock','sale','adjustment','return'),
    IN p_notes VARCHAR(255),
    IN p_created_by VARCHAR(50)
)
BEGIN
    DECLARE v_old_quantity INT DEFAULT 0;
    DECLARE v_new_quantity INT DEFAULT 0;
    DECLARE v_min_stock INT DEFAULT 0;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get current stock and minimum level
    SELECT stock_quantity, min_stock_level 
    INTO v_old_quantity, v_min_stock
    FROM products 
    WHERE id = p_product_id;
    
    -- Calculate new quantity
    SET v_new_quantity = v_old_quantity + p_quantity_change;
    
    -- Prevent negative stock
    IF v_new_quantity < 0 THEN
        SET v_new_quantity = 0;
        SET p_quantity_change = -v_old_quantity;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET 
        stock_quantity = v_new_quantity,
        status = CASE 
            WHEN v_new_quantity = 0 THEN 'inactive'
            WHEN v_new_quantity <= v_min_stock THEN 'low'
            ELSE 'active'
        END,
        last_restocked = CASE 
            WHEN p_change_type = 'restock' THEN CURRENT_TIMESTAMP
            ELSE last_restocked
        END
    WHERE id = p_product_id;
    
    -- Insert stock history record
    INSERT INTO stock_history (
        product_id, 
        change_type, 
        quantity_change, 
        old_quantity, 
        new_quantity, 
        notes, 
        created_by
    ) VALUES (
        p_product_id, 
        p_change_type, 
        p_quantity_change, 
        v_old_quantity, 
        v_new_quantity, 
        p_notes, 
        p_created_by
    );
    
    COMMIT;
END$$
DELIMITER ;

-- Show the updated table structure
DESCRIBE `products`;

-- Show sample data with stock information
SELECT 
    id,
    name,
    category,
    price,
    stock_quantity,
    min_stock_level,
    status,
    last_restocked
FROM `products` 
ORDER BY category, name
LIMIT 10;

-- Show low stock products
SELECT * FROM `low_stock_products`;

-- Show recent stock history
SELECT 
    sh.id,
    p.name as product_name,
    sh.change_type,
    sh.quantity_change,
    sh.old_quantity,
    sh.new_quantity,
    sh.notes,
    sh.created_by,
    sh.created_at
FROM stock_history sh
JOIN products p ON sh.product_id = p.id
ORDER BY sh.created_at DESC
LIMIT 10;
