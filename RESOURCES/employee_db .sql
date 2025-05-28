-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2025 at 06:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `employee_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `addons`
--

CREATE TABLE `addons` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `category` varchar(50) DEFAULT 'general',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addons`
--

INSERT INTO `addons` (`id`, `name`, `price`, `category`, `status`, `created_at`) VALUES
(1, 'Extra Milk', 15.00, 'coffee', 'active', '2025-05-26 01:45:20'),
(2, 'Extra Sugar', 10.00, 'coffee', 'active', '2025-05-26 01:45:20'),
(3, 'Whipped Cream', 20.00, 'coffee', 'active', '2025-05-26 01:45:20'),
(4, 'Caramel Syrup', 25.00, 'coffee', 'active', '2025-05-26 01:45:20');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `emp_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `role` varchar(20) NOT NULL,
  `password_hash` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`emp_id`, `name`, `role`, `password_hash`, `created_at`, `email`, `updated_at`) VALUES
(1, 'Crystal', 'admin', '4739ee3bd29e4f415da8ba9298a087e0fdc9c61378420ba8fbbab298bd74c4df', '2025-03-04 05:42:47', 'admin@example.com', '2025-03-11 11:23:56'),
(2, 'Ogille', 'cashier', '49df9bcdc4525530de9dbd9e677fe9e4897a1fe9b32e42ef1f9da60501739a00', '2025-03-04 05:42:47', 'cashier1@example.com', '2025-03-11 11:23:56'),
(3, 'Jesse', 'cashier', 'bcac371b54f59945a14aa49e2e408e5d6e4dbc59387f5d8cfc6b015d40d5bb02', '2025-03-04 05:42:47', 'cashier2@example.com', '2025-05-26 14:27:24');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `order_type` enum('dine_in','takeout') NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','preparing','ready','completed','cancelled') DEFAULT 'pending',
  `customer_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `order_type`, `total_amount`, `status`, `customer_name`, `created_at`, `updated_at`) VALUES
(18, '072', 'dine_in', 250.00, 'completed', NULL, '2025-05-27 22:53:25', '2025-05-28 14:22:42'),
(19, '220', 'dine_in', 310.00, 'completed', NULL, '2025-05-28 01:41:29', '2025-05-28 15:54:06'),
(20, '857', '', 285.00, 'completed', NULL, '2025-05-28 03:00:21', '2025-05-28 16:31:36'),
(21, '197', '', 350.00, 'pending', NULL, '2025-05-28 03:53:26', '2025-05-28 15:35:44'),
(22, '362', '', 285.00, 'completed', NULL, '2025-05-28 15:55:14', '2025-05-28 16:27:35'),
(23, '800', '', 200.00, 'completed', NULL, '2025-05-28 16:36:46', '2025-05-28 16:55:43');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `addons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`addons`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `total_price`, `addons`, `created_at`) VALUES
(29, 19, 1, 'Espresso', 1, 120.00, 120.00, '[\"Extra Milk\"]', '2025-05-28 02:12:19'),
(30, 19, 28, 'Carrot Cake', 1, 190.00, 190.00, '[]', '2025-05-28 02:12:19'),
(36, 20, 1, 'Espresso', 1, 120.00, 135.00, '[{\"name\":\"Extra Milk\",\"price\":15}]', '2025-05-28 03:00:21'),
(37, 20, 4, 'Latte', 1, 140.00, 150.00, '[{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-28 03:00:21'),
(38, 21, 21, 'BLT (Bacon, Lettuce, Tomato)', 1, 180.00, 180.00, '[]', '2025-05-28 03:53:26'),
(39, 21, 25, 'Tuna Salad Sandwich', 1, 170.00, 170.00, '[]', '2025-05-28 03:53:26'),
(43, 18, 16, 'Donut', 1, 80.00, 80.00, '[]', '2025-05-28 04:52:31'),
(44, 18, 25, 'Tuna Salad Sandwich', 1, 170.00, 170.00, '[]', '2025-05-28 04:52:31'),
(45, 22, 1, 'Espresso', 1, 120.00, 155.00, '[{\"name\":\"Extra Milk\",\"price\":15},{\"name\":\"Whipped Cream\",\"price\":20}]', '2025-05-28 15:55:14'),
(46, 22, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 15:55:14'),
(47, 23, 15, 'Blueberry Basil Soda', 1, 120.00, 130.00, '[{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-28 16:36:46'),
(48, 23, 18, 'Cinnamon Roll', 1, 70.00, 70.00, '[]', '2025-05-28 16:36:46');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` enum('active','inactive','low') DEFAULT 'active',
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `stock_quantity` int(11) DEFAULT 0,
  `low_stock_threshold` int(11) DEFAULT 10,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `category`, `status`, `description`, `image`, `created_at`, `stock_quantity`, `low_stock_threshold`, `updated_at`) VALUES
(1, 'Espresso', 120.00, 'Hot Coffee', 'active', 'Strong black coffee made by forcing steam through ground coffee beans', '../assets/images/espresso.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:40:00'),
(2, 'Cappuccino', 150.00, 'Hot Coffee', 'active', 'Espresso with steamed milk and foam', '../assets/images/cappuccino.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:39:55'),
(3, 'Americano', 130.00, 'Hot Coffee', 'active', 'Espresso with hot water for a smooth taste', '../assets/images/americano.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:39:52'),
(4, 'Latte', 140.00, 'Hot Coffee', 'active', 'Espresso with steamed milk', '../assets/images/latte.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:39:46'),
(5, 'Macha', 145.00, 'Hot Coffee', 'active', 'Traditional Japanese green tea powder drink', '../assets/images/macha.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:39:25'),
(6, 'Iced Latte', 140.00, 'Cold Coffee', 'active', 'Chilled espresso with cold milk', '../assets/images/Iced Latte .png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:40:25'),
(7, 'Iced Americano', 130.00, 'Cold Coffee', 'active', 'Chilled espresso with cold water', '../assets/images/iced_americano.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:40:21'),
(8, 'Cold Brew', 140.00, 'Cold Coffee', 'active', 'Smooth cold brewed coffee', '../assets/images/cold_brew.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:40:17'),
(9, 'Frappuccino', 160.00, 'Cold Coffee', 'active', 'Blended iced coffee drink with whipped cream', '../assets/images/frappuccino.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:40:12'),
(10, 'Affogato', 155.00, 'Cold Coffee', 'active', 'Vanilla ice cream drowned in hot espresso', '../assets/images/affogato.png', '2025-05-26 01:45:20', 50, 10, '2025-05-26 21:39:15'),
(11, 'Strawberry Italian Soda', 110.00, 'Non Coffee', 'active', 'Refreshing strawberry flavored soda', '../assets/images/strawberry_italian_soda.png', '2025-05-26 01:45:20', 30, 10, '2025-05-26 21:40:45'),
(12, 'Lemon-Lime Fizz', 110.00, 'Non Coffee', 'active', 'Citrus soda with lemon and lime', '../assets/images/lemon_lime_fizz.png', '2025-05-26 01:45:20', 30, 10, '2025-05-26 21:30:31'),
(13, 'Raspberry Spritzer', 115.00, 'Non Coffee', 'active', 'Sparkling raspberry flavored drink', '../assets/images/raspberry_pritzer.png', '2025-05-26 01:45:20', 30, 10, '2025-05-26 21:40:32'),
(14, 'Cucumber Mint Cooler', 120.00, 'Non Coffee', 'active', 'Refreshing cucumber and mint drink', '../assets/images/cucumber_mint_cooler.png', '2025-05-26 01:45:20', 30, 10, '2025-05-26 21:40:36'),
(15, 'Blueberry Basil Soda', 120.00, 'Non Coffee', 'active', 'Unique blueberry and basil flavored soda', '../assets/images/blueberry_basil_soda.png', '2025-05-26 01:45:20', 30, 10, '2025-05-26 21:39:02'),
(16, 'Donut', 80.00, 'Pastry', 'active', 'Classic glazed donut', '../assets/images/donut.png', '2025-05-26 01:45:20', 20, 10, '2025-05-26 21:38:34'),
(17, 'Apple Pie', 90.00, 'Pastry', 'active', 'Traditional apple pie with cinnamon', '../assets/images/apple_pie.png', '2025-05-26 01:45:20', 20, 10, '2025-05-26 21:38:31'),
(18, 'Cinnamon Roll', 70.00, 'Pastry', 'active', 'Sweet cinnamon roll with icing', '../assets/images/cinnamon_roll.png', '2025-05-26 01:45:20', 20, 10, '2025-05-26 21:38:28'),
(19, 'Sugar Cookie', 60.00, 'Pastry', 'active', 'Classic sugar cookie', '../assets/images/sugar_cookie.png', '2025-05-26 01:45:20', 20, 10, '2025-05-26 21:38:24'),
(20, 'Brownie', 75.00, 'Pastry', 'active', 'Rich chocolate brownie', '../assets/images/brownie.png', '2025-05-26 01:45:20', 20, 10, '2025-05-26 21:38:09'),
(21, 'BLT (Bacon, Lettuce, Tomato)', 180.00, 'Sandwich', 'active', 'Classic bacon, lettuce and tomato sandwich', '../assets/images/blt.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:37:58'),
(22, 'Club Sandwich', 190.00, 'Sandwich', 'active', 'Multi-layered sandwich with chicken, bacon and vegetables', '../assets/images/club_sandwich.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:37:55'),
(23, 'Grilled Cheese', 150.00, 'Sandwich', 'active', 'Grilled sandwich with melted cheese', '../assets/images/grilled_cheese.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:37:50'),
(24, 'Ham and Cheese Sandwich', 160.00, 'Sandwich', 'active', 'Classic ham and cheese combination', '../assets/images/ham_cheese_sandwich.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:37:42'),
(25, 'Tuna Salad Sandwich', 170.00, 'Sandwich', 'active', 'Fresh tuna salad on bread', '../assets/images/tuna_salad_sandwich.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:37:29'),
(26, 'Chocolate Cake', 200.00, 'Cake', 'low', 'Rich and moist chocolate cake', '../assets/images/chocolate_cake.png', '2025-05-26 01:45:20', 10, 10, '2025-05-27 20:26:39'),
(27, 'Cheesecake', 220.00, 'Cake', 'active', 'Creamy New York style cheesecake', '../assets/images/cheesecake.png', '2025-05-26 01:45:20', 10, 3, '2025-05-26 22:37:20'),
(28, 'Carrot Cake', 190.00, 'Cake', 'active', 'Moist carrot cake with cream cheese frosting', '../assets/images/carrot_cake.png', '2025-05-26 01:45:20', 15, 10, '2025-05-26 21:36:14'),
(29, 'Black Forest Cake', 210.00, 'Cake', 'active', 'Chocolate cake with cherries and whipped cream', '../assets/images/black_forest_cake.png', '2025-05-26 01:45:20', 9, 5, '2025-05-26 22:16:45'),
(30, 'Red Velvet Cake', 215.00, 'Cake', 'low', 'Classic red velvet cake with cream cheese frosting', '../assets/images/red_velvet_cake.png', '2025-05-26 01:45:20', 4, 5, '2025-05-28 00:19:31');

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE `stock_history` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `old_quantity` int(11) NOT NULL DEFAULT 0,
  `new_quantity` int(11) NOT NULL DEFAULT 0,
  `quantity_change` int(11) NOT NULL DEFAULT 0,
  `reason` varchar(50) NOT NULL DEFAULT 'ADJUSTMENT',
  `notes` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_history`
--

INSERT INTO `stock_history` (`id`, `product_id`, `old_quantity`, `new_quantity`, `quantity_change`, `reason`, `notes`, `updated_by`, `created_at`) VALUES
(34, 30, 4, 4, 0, 'ADJUSTMENT', '', 1, '2025-05-26 22:09:28'),
(35, 30, 4, 6, 2, 'ADJUSTMENT', '', 1, '2025-05-26 22:16:24'),
(36, 29, 15, 9, -6, 'SOLD', '', 1, '2025-05-26 22:16:34'),
(37, 27, 8, 0, -8, 'DAMAGED', '', 1, '2025-05-26 22:16:57'),
(38, 27, 0, 10, 10, 'RESTOCK', '', 1, '2025-05-26 22:37:20'),
(39, 30, 6, 4, -2, 'SOLD', '', 1, '2025-05-27 20:22:11'),
(40, 26, 0, 10, 10, 'RESTOCK', '', 1, '2025-05-27 20:26:39'),
(41, 30, 10, 4, -6, 'DAMAGED', '', 1, '2025-05-28 00:19:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_addons_category` (`category`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`emp_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_date` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_category` (`category`),
  ADD KEY `idx_products_status` (`status`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `emp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD CONSTRAINT `stock_history_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
