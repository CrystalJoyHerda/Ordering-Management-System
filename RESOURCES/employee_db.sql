-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 26, 2025 at 03:50 AM
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
(3, 'Jesse', 'cashier', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2025-03-04 05:42:47', 'cashier2@example.com', '2025-03-11 11:23:56'),
(4, 'Jenie', 'cashier', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2025-03-04 05:42:47', 'cashier3@example.com', '2025-03-11 11:23:56'),
(5, 'admin', 'admin', 'password123', '2025-04-06 13:19:25', 'admin@example.com', '2025-04-06 21:19:25');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `category`, `status`, `description`, `image`, `created_at`) VALUES
(1, 'Espresso', 120.00, 'coffee', 'active', 'Strong black coffee made by forcing steam through ground coffee beans', '../assets/images/espresso.png', '2025-05-26 01:45:20'),
(2, 'Cappuccino', 150.00, 'coffee', 'active', 'Espresso with steamed milk and foam', '../assets/images/cappuccino.png', '2025-05-26 01:45:20'),
(3, 'Americano', 130.00, 'coffee', 'active', 'Espresso with hot water for a smooth taste', '../assets/images/americano.png', '2025-05-26 01:45:20'),
(4, 'Latte', 140.00, 'coffee', 'active', 'Espresso with steamed milk', '../assets/images/latte.png', '2025-05-26 01:45:20'),
(5, 'Macha', 145.00, 'coffee', 'active', 'Traditional Japanese green tea powder drink', '../assets/images/macha.png', '2025-05-26 01:45:20'),
(6, 'Iced Latte', 140.00, 'coffee', 'active', 'Chilled espresso with cold milk', '../assets/images/Iced Latte .png', '2025-05-26 01:45:20'),
(7, 'Iced Americano', 130.00, 'coffee', 'active', 'Chilled espresso with cold water', '../assets/images/iced_americano.png', '2025-05-26 01:45:20'),
(8, 'Cold Brew', 140.00, 'coffee', 'active', 'Smooth cold brewed coffee', '../assets/images/cold_brew.png', '2025-05-26 01:45:20'),
(9, 'Frappuccino', 160.00, 'coffee', 'active', 'Blended iced coffee drink with whipped cream', '../assets/images/frappuccino.png', '2025-05-26 01:45:20'),
(10, 'Affogato', 155.00, 'coffee', 'active', 'Vanilla ice cream drowned in hot espresso', '../assets/images/affogato.png', '2025-05-26 01:45:20'),
(11, 'Strawberry Italian Soda', 110.00, 'beverages', 'active', 'Refreshing strawberry flavored soda', '../assets/images/strawberry_italian_soda.png', '2025-05-26 01:45:20'),
(12, 'Lemon-Lime Fizz', 110.00, 'beverages', 'active', 'Citrus soda with lemon and lime', '../assets/images/lemon_lime_fizz.png', '2025-05-26 01:45:20'),
(13, 'Raspberry Spritzer', 115.00, 'beverages', 'active', 'Sparkling raspberry flavored drink', '../assets/images/raspberry_pritzer.png', '2025-05-26 01:45:20'),
(14, 'Cucumber Mint Cooler', 120.00, 'beverages', 'active', 'Refreshing cucumber and mint drink', '../assets/images/cucumber_mint_cooler.png', '2025-05-26 01:45:20'),
(15, 'Blueberry Basil Soda', 120.00, 'beverages', 'active', 'Unique blueberry and basil flavored soda', '../assets/images/blueberry_basil_soda.png', '2025-05-26 01:45:20'),
(16, 'Donut', 80.00, 'pastries', 'active', 'Classic glazed donut', '../assets/images/donut.png', '2025-05-26 01:45:20'),
(17, 'Apple Pie', 90.00, 'pastries', 'active', 'Traditional apple pie with cinnamon', '../assets/images/apple_pie.png', '2025-05-26 01:45:20'),
(18, 'Cinnamon Roll', 70.00, 'pastries', 'active', 'Sweet cinnamon roll with icing', '../assets/images/cinnamon_roll.png', '2025-05-26 01:45:20'),
(19, 'Sugar Cookie', 60.00, 'pastries', 'active', 'Classic sugar cookie', '../assets/images/sugar_cookie.png', '2025-05-26 01:45:20'),
(20, 'Brownie', 75.00, 'pastries', 'active', 'Rich chocolate brownie', '../assets/images/brownie.png', '2025-05-26 01:45:20'),
(21, 'BLT (Bacon, Lettuce, Tomato)', 180.00, 'sandwiches', 'active', 'Classic bacon, lettuce and tomato sandwich', '../assets/images/blt.png', '2025-05-26 01:45:20'),
(22, 'Club Sandwich', 190.00, 'sandwiches', 'active', 'Multi-layered sandwich with chicken, bacon and vegetables', '../assets/images/club_sandwich.png', '2025-05-26 01:45:20'),
(23, 'Grilled Cheese', 150.00, 'sandwiches', 'active', 'Grilled sandwich with melted cheese', '../assets/images/grilled_cheese.png', '2025-05-26 01:45:20'),
(24, 'Ham and Cheese Sandwich', 160.00, 'sandwiches', 'active', 'Classic ham and cheese combination', '../assets/images/ham_cheese_sandwich.png', '2025-05-26 01:45:20'),
(25, 'Tuna Salad Sandwich', 170.00, 'sandwiches', 'active', 'Fresh tuna salad on bread', '../assets/images/tuna_salad_sandwich.png', '2025-05-26 01:45:20'),
(26, 'Chocolate Cake', 200.00, 'cakes', 'active', 'Rich and moist chocolate cake', '../assets/images/chocolate_cake.png', '2025-05-26 01:45:20'),
(27, 'Cheesecake', 220.00, 'cakes', 'active', 'Creamy New York style cheesecake', '../assets/images/cheesecake.png', '2025-05-26 01:45:20'),
(28, 'Carrot Cake', 190.00, 'cakes', 'active', 'Moist carrot cake with cream cheese frosting', '../assets/images/carrot_cake.png', '2025-05-26 01:45:20'),
(29, 'Black Forest Cake', 210.00, 'cakes', 'active', 'Chocolate cake with cherries and whipped cream', '../assets/images/black_forest_cake.png', '2025-05-26 01:45:20'),
(30, 'Red Velvet Cake', 215.00, 'cakes', 'active', 'Classic red velvet cake with cream cheese frosting', '../assets/images/red_velvet_cake.png', '2025-05-26 01:45:20');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
