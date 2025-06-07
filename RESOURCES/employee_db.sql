-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2025 at 07:13 AM
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `contact_number` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`emp_id`, `name`, `role`, `password_hash`, `created_at`, `email`, `updated_at`, `contact_number`, `address`) VALUES
(1, 'Crystal', 'admin', '4739ee3bd29e4f415da8ba9298a087e0fdc9c61378420ba8fbbab298bd74c4df', '2025-03-04 05:42:47', 'admin@example.com', '2025-06-06 00:50:57', '09486936434', 'MC Village Baranggay Fatima G.S.C'),
(2, 'Ogille', 'cashier', '49df9bcdc4525530de9dbd9e677fe9e4897a1fe9b32e42ef1f9da60501739a00', '2025-03-04 05:42:47', 'cashier1@example.com', '2025-05-31 03:02:09', NULL, NULL),
(3, 'Jesse', 'cashier', 'bcac371b54f59945a14aa49e2e408e5d6e4dbc59387f5d8cfc6b015d40d5bb02', '2025-03-04 05:42:47', 'cashier2@example.com', '2025-05-31 03:03:59', NULL, NULL);

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
(21, '197', '', 350.00, 'cancelled', NULL, '2025-05-28 03:53:26', '2025-05-31 06:53:35'),
(22, '362', '', 285.00, 'completed', NULL, '2025-05-28 15:55:14', '2025-05-28 16:27:35'),
(23, '800', '', 200.00, 'completed', NULL, '2025-05-28 16:36:46', '2025-05-28 16:55:43'),
(24, '710', '', 415.00, 'completed', NULL, '2025-05-28 16:59:38', '2025-05-28 17:00:41'),
(25, '569', '', 305.00, 'completed', NULL, '2025-05-28 17:02:00', '2025-05-28 17:02:40'),
(26, '139', '', 270.00, 'completed', NULL, '2025-05-28 17:06:01', '2025-05-28 17:27:19'),
(27, '474', 'dine_in', 425.00, 'completed', NULL, '2025-05-28 17:36:29', '2025-05-28 17:37:20'),
(28, '636', '', 430.00, 'completed', NULL, '2025-05-28 18:44:47', '2025-05-28 18:46:07'),
(29, '730', 'dine_in', 150.00, 'completed', NULL, '2025-05-28 18:48:16', '2025-05-28 18:48:28'),
(30, '921', 'dine_in', 210.00, 'completed', NULL, '2025-05-28 18:54:26', '2025-05-28 18:54:32'),
(31, '269', 'dine_in', 120.00, 'completed', NULL, '2025-05-28 19:19:51', '2025-05-28 20:15:01'),
(32, '634', 'dine_in', 120.00, 'completed', NULL, '2025-05-28 19:53:12', '2025-05-28 20:29:49'),
(33, '632', 'dine_in', 230.00, 'cancelled', NULL, '2025-05-28 20:13:57', '2025-05-31 06:53:35'),
(34, '312', '', 380.00, 'cancelled', NULL, '2025-05-28 20:16:49', '2025-05-31 06:53:35'),
(35, '992', '', 410.00, 'cancelled', NULL, '2025-05-28 20:18:12', '2025-05-31 06:53:35'),
(36, '172', '', 625.00, 'cancelled', NULL, '2025-05-28 20:20:00', '2025-05-31 06:53:35'),
(37, '190', '', 280.00, 'completed', NULL, '2025-05-28 20:20:51', '2025-05-28 20:38:35'),
(38, '822', '', 280.00, 'cancelled', NULL, '2025-05-28 20:22:27', '2025-05-31 06:53:35'),
(39, '360', '', 280.00, 'cancelled', NULL, '2025-05-28 20:24:21', '2025-05-31 06:53:35'),
(40, '345', '', 420.00, 'cancelled', NULL, '2025-05-28 20:25:05', '2025-05-31 06:53:35'),
(41, '248', '', 280.00, 'cancelled', NULL, '2025-05-28 20:25:44', '2025-05-31 06:53:35'),
(42, '401', '', 270.00, 'cancelled', NULL, '2025-05-28 20:36:42', '2025-05-31 06:53:35'),
(43, '723', '', 270.00, 'completed', NULL, '2025-05-28 20:37:51', '2025-05-28 20:39:48'),
(44, '413', '', 135.00, 'cancelled', NULL, '2025-05-31 06:56:09', '2025-05-31 06:56:19'),
(45, '790', '', 150.00, 'completed', NULL, '2025-05-31 07:01:09', '2025-05-31 07:08:08'),
(46, '808', '', 160.00, 'cancelled', NULL, '2025-05-31 07:10:14', '2025-06-01 20:55:08'),
(47, '364', '', 130.00, 'cancelled', NULL, '2025-05-31 07:11:03', '2025-06-01 20:55:08'),
(48, '898', '', 160.00, 'cancelled', NULL, '2025-05-31 07:14:24', '2025-06-01 20:55:08'),
(49, '198', '', 145.00, 'cancelled', NULL, '2025-05-31 07:16:40', '2025-06-01 20:55:08'),
(50, '869', '', 160.00, 'cancelled', NULL, '2025-05-31 07:22:01', '2025-06-01 20:55:08'),
(51, '346', '', 145.00, 'cancelled', NULL, '2025-05-31 07:24:59', '2025-06-01 20:55:08'),
(52, '974', '', 130.00, 'cancelled', NULL, '2025-05-31 07:25:16', '2025-06-01 20:55:08'),
(53, '261', '', 150.00, 'cancelled', NULL, '2025-05-31 07:25:45', '2025-06-01 20:55:08'),
(54, '253', '', 130.00, 'cancelled', NULL, '2025-05-31 07:26:16', '2025-06-01 20:55:08'),
(55, '770', '', 395.00, 'cancelled', NULL, '2025-06-01 20:54:27', '2025-06-02 07:13:20'),
(56, '343', '', 150.00, 'cancelled', NULL, '2025-06-01 21:37:01', '2025-06-02 07:13:20'),
(57, '888', '', 90.00, 'completed', NULL, '2025-06-01 21:38:31', '2025-06-02 06:58:46'),
(58, '183', '', 600.00, 'completed', NULL, '2025-06-02 02:39:07', '2025-06-02 07:33:43'),
(59, '766', 'dine_in', 325.00, 'completed', NULL, '2025-06-02 02:40:08', '2025-06-02 06:29:40'),
(60, '783', 'dine_in', 595.00, 'completed', NULL, '2025-06-02 02:41:23', '2025-06-02 06:28:55'),
(61, 'TEST1748848420', 'dine_in', 150.00, 'cancelled', NULL, '2025-06-01 22:13:40', '2025-06-02 07:13:45'),
(62, 'TEST1748848436', 'dine_in', 150.00, 'cancelled', NULL, '2025-06-01 22:13:56', '2025-06-02 07:13:56'),
(63, '214', '', 150.00, 'completed', NULL, '2025-06-02 07:14:52', '2025-06-02 07:29:09'),
(64, '030', '', 140.00, 'completed', NULL, '2025-06-02 07:16:10', '2025-06-02 07:31:02'),
(65, '537', '', 165.00, 'completed', NULL, '2025-06-03 15:27:19', '2025-06-03 15:27:49'),
(70, '877', '', 860.00, 'completed', NULL, '2025-06-04 04:48:28', '2025-06-04 04:48:53'),
(71, '746', 'dine_in', 1050.00, 'completed', NULL, '2025-06-04 05:02:17', '2025-06-04 06:38:07'),
(72, '283', '', 1430.00, 'cancelled', NULL, '2025-06-04 06:38:38', '2025-06-04 07:00:32'),
(73, '179', '', 1595.00, 'cancelled', NULL, '2025-06-04 06:51:25', '2025-06-04 07:00:32'),
(74, '753', '', 1210.00, 'cancelled', NULL, '2025-06-04 06:53:29', '2025-06-04 07:00:32'),
(78, '558', '', 480.00, 'completed', NULL, '2025-06-04 07:14:01', '2025-06-04 07:17:29'),
(79, '140', 'dine_in', 600.00, 'completed', NULL, '2025-06-04 07:15:04', '2025-06-04 07:19:00'),
(80, '447', 'dine_in', 1675.00, 'completed', NULL, '2025-06-04 07:15:59', '2025-06-04 07:18:03'),
(81, '778', 'dine_in', 130.00, 'completed', NULL, '2025-06-04 07:18:11', '2025-06-04 07:18:20'),
(82, '099', '', 555.00, 'completed', NULL, '2025-06-04 07:35:30', '2025-06-04 07:37:36'),
(83, '571', '', 1890.00, 'completed', NULL, '2025-06-04 07:39:13', '2025-06-04 07:39:42'),
(84, '091', 'dine_in', 480.00, 'completed', 'Test Customer', '2025-06-04 07:39:45', '2025-06-04 07:39:45'),
(85, '638', '', 950.00, 'completed', NULL, '2025-06-04 07:41:11', '2025-06-04 07:41:29'),
(90, '987', '', 1075.00, 'completed', NULL, '2025-06-04 16:18:48', '2025-06-04 16:53:50'),
(91, '480', '', 215.00, 'completed', NULL, '2025-06-04 18:10:31', '2025-06-04 18:11:06'),
(92, '667', '', 140.00, 'completed', NULL, '2025-06-04 18:29:49', '2025-06-04 18:30:27'),
(93, '212', '', 260.00, 'completed', NULL, '2025-06-04 18:30:54', '2025-06-04 18:31:13'),
(94, '553', '', 950.00, 'completed', NULL, '2025-06-04 18:32:07', '2025-06-04 18:32:25'),
(95, '292', '', 950.00, 'completed', NULL, '2025-06-04 18:32:47', '2025-06-04 18:33:03'),
(96, '853', '', 950.00, 'completed', NULL, '2025-06-04 18:40:33', '2025-06-04 18:40:55'),
(97, '001', '', 100.00, 'completed', 'Auto-Deduction Diagnostic Test', '2025-06-04 18:42:02', '2025-06-04 18:47:12'),
(98, '145', '', 570.00, 'completed', NULL, '2025-06-04 18:46:27', '2025-06-04 18:46:44'),
(99, '924', '', 380.00, 'completed', NULL, '2025-06-04 18:47:38', '2025-06-04 18:47:54'),
(100, '496', '', 2420.00, 'completed', NULL, '2025-06-04 18:48:37', '2025-06-04 18:48:59'),
(101, '785', '', 5850.00, 'completed', NULL, '2025-06-04 18:49:44', '2025-06-04 18:50:09'),
(102, '810', '', 575.00, 'completed', NULL, '2025-06-04 19:42:28', '2025-06-04 19:42:50'),
(103, '812', '', 860.00, 'completed', NULL, '2025-06-04 20:00:00', '2025-06-04 20:00:37'),
(104, '223', '', 510.00, 'completed', NULL, '2025-06-04 20:19:41', '2025-06-05 04:08:00'),
(105, '188', 'dine_in', 170.00, 'completed', NULL, '2025-06-04 20:20:27', '2025-06-04 20:21:28'),
(106, '490', '', 275.00, 'completed', NULL, '2025-06-04 21:51:55', '2025-06-04 21:52:41'),
(107, '760', '', 645.00, 'completed', NULL, '2025-06-04 22:10:30', '2025-06-04 22:11:02');

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
(48, 23, 18, 'Cinnamon Roll', 1, 70.00, 70.00, '[]', '2025-05-28 16:36:46'),
(49, 24, 1, 'Espresso', 1, 120.00, 145.00, '[{\"name\":\"Extra Milk\",\"price\":15},{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-28 16:59:38'),
(50, 24, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 16:59:38'),
(51, 24, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 16:59:38'),
(52, 25, 2, 'Cappuccino', 1, 150.00, 165.00, '[{\"name\":\"Extra Milk\",\"price\":15}]', '2025-05-28 17:02:00'),
(53, 25, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 17:02:00'),
(54, 26, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 17:06:01'),
(55, 26, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 17:06:01'),
(66, 27, 3, 'Americano', 1, 150.00, 150.00, '[\"Whipped Cream\"]', '2025-05-28 17:37:10'),
(67, 27, 24, 'Ham and Cheese Sandwich', 1, 160.00, 160.00, '[]', '2025-05-28 17:37:10'),
(68, 27, 13, 'Raspberry Spritzer', 1, 115.00, 115.00, '[]', '2025-05-28 17:37:10'),
(69, 28, 1, 'Espresso', 1, 120.00, 145.00, '[{\"name\":\"Extra Milk\",\"price\":15},{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-28 18:44:47'),
(70, 28, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 18:44:47'),
(71, 28, 5, 'Macha', 1, 145.00, 145.00, '[]', '2025-05-28 18:44:47'),
(72, 29, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 18:48:16'),
(73, 30, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-05-28 18:54:26'),
(115, 31, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-05-28 20:14:44'),
(116, 34, 25, 'Tuna Salad Sandwich', 1, 170.00, 170.00, '[]', '2025-05-28 20:16:49'),
(117, 34, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-05-28 20:16:49'),
(118, 35, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:18:12'),
(119, 35, 4, 'Latte', 2, 140.00, 280.00, '[]', '2025-05-28 20:18:12'),
(120, 36, 1, 'Espresso', 4, 120.00, 480.00, '[]', '2025-05-28 20:20:00'),
(121, 36, 5, 'Macha', 1, 145.00, 145.00, '[]', '2025-05-28 20:20:00'),
(122, 37, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 20:20:51'),
(123, 37, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:20:51'),
(124, 38, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 20:22:27'),
(125, 38, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:22:27'),
(126, 39, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 20:24:21'),
(127, 39, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:24:21'),
(128, 40, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 20:25:05'),
(129, 40, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:25:05'),
(130, 40, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 20:25:05'),
(131, 41, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-28 20:25:44'),
(132, 41, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:25:44'),
(134, 32, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-05-28 20:29:03'),
(135, 42, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:36:42'),
(136, 42, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 20:36:42'),
(137, 43, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-28 20:37:51'),
(138, 43, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-05-28 20:37:51'),
(141, 33, 4, 'Latte', 1, 140.00, 140.00, '[\"Extra Milk\"]', '2025-05-31 01:59:08'),
(142, 33, 17, 'Apple Pie', 1, 90.00, 90.00, '[]', '2025-05-31 01:59:08'),
(143, 44, 1, 'Espresso', 1, 120.00, 135.00, '[{\"name\":\"Extra Milk\",\"price\":15}]', '2025-05-31 06:56:09'),
(144, 45, 4, 'Latte', 1, 140.00, 150.00, '[{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-31 07:01:09'),
(145, 46, 24, 'Ham and Cheese Sandwich', 1, 160.00, 160.00, '[]', '2025-05-31 07:10:14'),
(146, 47, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-31 07:11:03'),
(147, 48, 2, 'Cappuccino', 1, 150.00, 160.00, '[{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-05-31 07:14:24'),
(148, 49, 5, 'Macha', 1, 145.00, 145.00, '[]', '2025-05-31 07:16:40'),
(149, 50, 9, 'Frappuccino', 1, 160.00, 160.00, '[]', '2025-05-31 07:22:01'),
(150, 51, 5, 'Macha', 1, 145.00, 145.00, '[]', '2025-05-31 07:24:59'),
(151, 52, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-05-31 07:25:16'),
(152, 53, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-05-31 07:25:45'),
(153, 54, 7, 'Iced Americano', 1, 130.00, 130.00, '[]', '2025-05-31 07:26:16'),
(154, 55, 9, 'Frappuccino', 1, 160.00, 185.00, '[{\"name\":\"Caramel Syrup\",\"price\":25}]', '2025-06-01 20:54:27'),
(155, 55, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-01 20:54:27'),
(156, 56, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-06-01 21:37:01'),
(157, 57, 17, 'Apple Pie', 1, 90.00, 90.00, '[]', '2025-06-01 21:38:31'),
(158, 58, 13, 'Raspberry Spritzer', 1, 115.00, 115.00, '[]', '2025-06-02 02:39:07'),
(159, 58, 4, 'Latte', 1, 140.00, 155.00, '[{\"name\":\"Extra Milk\",\"price\":15}]', '2025-06-02 02:39:07'),
(160, 58, 4, 'Latte', 1, 140.00, 165.00, '[{\"name\":\"Caramel Syrup\",\"price\":25}]', '2025-06-02 02:39:07'),
(161, 58, 4, 'Latte', 1, 140.00, 165.00, '[{\"name\":\"Caramel Syrup\",\"price\":25}]', '2025-06-02 02:39:07'),
(169, 60, 9, 'Frappuccino', 1, 185.00, 185.00, '[\"Caramel Syrup\"]', '2025-06-02 02:42:27'),
(170, 60, 23, 'Grilled Cheese', 1, 100.00, 100.00, '[]', '2025-06-02 02:42:27'),
(171, 60, 24, 'Ham and Cheese Sandwich', 1, 160.00, 160.00, '[]', '2025-06-02 02:42:27'),
(172, 60, 6, 'Iced Latte', 1, 150.00, 150.00, '[\"Extra Sugar\"]', '2025-06-02 02:42:27'),
(173, 59, 13, 'Raspberry Spritzer', 1, 115.00, 115.00, '[]', '2025-06-02 06:29:29'),
(174, 59, 18, 'Cinnamon Roll', 1, 70.00, 70.00, '[]', '2025-06-02 06:29:29'),
(175, 59, 1, 'Espresso', 1, 140.00, 140.00, '[\"Whipped Cream\"]', '2025-06-02 06:29:29'),
(176, 63, 2, 'Cappuccino', 1, 150.00, 150.00, '[]', '2025-06-02 07:14:52'),
(177, 64, 4, 'Latte', 1, 140.00, 140.00, '[]', '2025-06-02 07:16:10'),
(178, 65, 5, 'Macha', 1, 145.00, 165.00, '[{\"name\":\"Whipped Cream\",\"price\":20}]', '2025-06-03 15:27:19'),
(179, 70, 30, 'Red Velvet Cake', 1, 215.00, 215.00, '[]', '2025-06-04 04:48:28'),
(180, 70, 30, 'Red Velvet Cake', 1, 215.00, 215.00, '[]', '2025-06-04 04:48:28'),
(181, 70, 30, 'Red Velvet Cake', 1, 215.00, 215.00, '[]', '2025-06-04 04:48:28'),
(182, 70, 30, 'Red Velvet Cake', 1, 215.00, 215.00, '[]', '2025-06-04 04:48:28'),
(234, 71, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-04 05:03:21'),
(235, 71, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-04 05:03:21'),
(236, 71, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-04 05:03:21'),
(237, 71, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-04 05:03:21'),
(238, 71, 29, 'Black Forest Cake', 1, 210.00, 210.00, '[]', '2025-06-04 05:03:21'),
(295, 78, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:14:01'),
(296, 78, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:14:01'),
(297, 78, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:14:01'),
(298, 78, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:14:01'),
(306, 80, 21, 'BLT (Bacon, Lettuce, Tomato)', 5, 180.00, 900.00, '[]', '2025-06-04 07:16:46'),
(307, 80, 3, 'Americano', 4, 130.00, 520.00, '[]', '2025-06-04 07:16:46'),
(308, 80, 1, 'Espresso', 1, 135.00, 135.00, '[\"Extra Milk\"]', '2025-06-04 07:16:46'),
(309, 80, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:16:46'),
(310, 81, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-06-04 07:18:11'),
(313, 79, 5, 'Macha', 2, 145.00, 290.00, '[]', '2025-06-04 07:18:47'),
(314, 79, 3, 'Americano', 1, 150.00, 150.00, '[\"Whipped Cream\"]', '2025-06-04 07:18:47'),
(315, 79, 5, 'Macha', 1, 160.00, 160.00, '[\"Extra Milk\"]', '2025-06-04 07:18:47'),
(316, 82, 1, 'Espresso', 1, 120.00, 140.00, '[{\"name\":\"Whipped Cream\",\"price\":20}]', '2025-06-04 07:35:30'),
(317, 82, 1, 'Espresso', 1, 120.00, 120.00, '[]', '2025-06-04 07:35:30'),
(318, 82, 3, 'Americano', 1, 130.00, 155.00, '[{\"name\":\"Caramel Syrup\",\"price\":25}]', '2025-06-04 07:35:30'),
(319, 82, 3, 'Americano', 1, 130.00, 140.00, '[{\"name\":\"Extra Sugar\",\"price\":10}]', '2025-06-04 07:35:30'),
(320, 83, 29, 'Black Forest Cake', 9, 210.00, 1890.00, '[]', '2025-06-04 07:39:13'),
(321, 84, 3, 'Americano', 2, 150.00, 300.00, NULL, '2025-06-04 07:39:45'),
(322, 84, 2, 'Cappuccino', 1, 180.00, 180.00, NULL, '2025-06-04 07:39:45'),
(323, 85, 28, 'Carrot Cake', 5, 190.00, 950.00, '[]', '2025-06-04 07:41:11'),
(324, 90, 30, 'Red Velvet Cake', 5, 215.00, 1075.00, '[]', '2025-06-04 16:18:48'),
(325, 91, 30, 'Red Velvet Cake', 1, 215.00, 215.00, '[]', '2025-06-04 18:10:31'),
(326, 92, 6, 'Iced Latte', 1, 140.00, 140.00, '[]', '2025-06-04 18:29:49'),
(327, 93, 7, 'Iced Americano', 2, 130.00, 260.00, '[]', '2025-06-04 18:30:54'),
(328, 94, 28, 'Carrot Cake', 5, 190.00, 950.00, '[]', '2025-06-04 18:32:07'),
(329, 95, 28, 'Carrot Cake', 5, 190.00, 950.00, '[]', '2025-06-04 18:32:47'),
(330, 96, 28, 'Carrot Cake', 5, 190.00, 950.00, '[]', '2025-06-04 18:40:33'),
(331, 97, 3, 'Americano', 1, 100.00, 100.00, '[]', '2025-06-04 18:42:02'),
(332, 98, 28, 'Carrot Cake', 3, 190.00, 570.00, '[]', '2025-06-04 18:46:27'),
(333, 99, 28, 'Carrot Cake', 2, 190.00, 380.00, '[]', '2025-06-04 18:47:38'),
(334, 100, 27, 'Cheesecake', 11, 220.00, 2420.00, '[]', '2025-06-04 18:48:37'),
(335, 101, 3, 'Americano', 45, 130.00, 5850.00, '[]', '2025-06-04 18:49:44'),
(336, 102, 13, 'Raspberry Spritzer', 5, 115.00, 575.00, '[]', '2025-06-04 19:42:28'),
(337, 103, 30, 'Red Velvet Cake', 4, 215.00, 860.00, '[]', '2025-06-04 20:00:00'),
(338, 104, 25, 'Tuna Salad Sandwich', 3, 170.00, 510.00, '[]', '2025-06-04 20:19:41'),
(374, 105, 25, 'Tuna Salad Sandwich', 1, 170.00, 170.00, '[]', '2025-06-04 20:21:21'),
(375, 106, 3, 'Americano', 1, 130.00, 145.00, '[{\"name\":\"Extra Milk\",\"price\":15}]', '2025-06-04 21:51:55'),
(376, 106, 3, 'Americano', 1, 130.00, 130.00, '[]', '2025-06-04 21:51:55'),
(377, 107, 30, 'Red Velvet Cake', 3, 215.00, 645.00, '[]', '2025-06-04 22:10:30');

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
(1, 'Espresso', 120.00, 'Hot Coffee', 'active', 'Strong black coffee made by forcing steam through ground coffee beans', '../assets/images/espresso.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 20:43:13'),
(2, 'Cappuccino', 150.00, 'Hot Coffee', 'active', 'Espresso with steamed milk and foam', '../assets/images/cappuccino.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 20:43:07'),
(3, 'Americano', 130.00, 'Hot Coffee', 'active', 'Espresso with hot water for a smooth taste', '../assets/images/americano.png', '2025-05-26 01:45:20', 13, 5, '2025-06-04 21:52:41'),
(4, 'Latte', 140.00, 'Hot Coffee', 'active', 'Espresso with steamed milk', '../assets/images/latte.png', '2025-05-26 01:45:20', 50, 5, '2025-06-04 18:17:06'),
(5, 'Macha', 145.00, 'Hot Coffee', 'active', 'Traditional Japanese green tea powder drink', '../assets/images/macha.png', '2025-05-26 01:45:20', 50, 5, '2025-06-04 18:17:09'),
(6, 'Iced Latte', 140.00, 'Cold Coffee', 'active', 'Chilled espresso with cold milk', '../assets/images/Iced Latte .png', '2025-05-26 01:45:20', 49, 5, '2025-06-04 18:30:27'),
(7, 'Iced Americano', 130.00, 'Cold Coffee', 'active', 'Chilled espresso with cold water', '../assets/images/iced_americano.png', '2025-05-26 01:45:20', 48, 5, '2025-06-04 18:31:13'),
(8, 'Cold Brew', 140.00, 'Cold Coffee', 'active', 'Smooth cold brewed coffee', '../assets/images/cold_brew.png', '2025-05-26 01:45:20', 50, 5, '2025-06-04 18:17:23'),
(9, 'Frappuccino', 160.00, 'Cold Coffee', 'active', 'Blended iced coffee drink with whipped cream', '../assets/images/frappuccino.png', '2025-05-26 01:45:20', 50, 5, '2025-06-04 18:17:26'),
(10, 'Affogato', 155.00, 'Cold Coffee', 'active', 'Vanilla ice cream drowned in hot espresso', '../assets/images/affogato.png', '2025-05-26 01:45:20', 50, 5, '2025-06-04 18:17:31'),
(11, 'Strawberry Italian Soda', 110.00, 'Non Coffee', 'active', 'Refreshing strawberry flavored soda', '../assets/images/strawberry_italian_soda.png', '2025-05-26 01:45:20', 30, 5, '2025-06-04 18:17:35'),
(12, 'Lemon-Lime Fizz', 110.00, 'Non Coffee', 'active', 'Citrus soda with lemon and lime', '../assets/images/lemon_lime_fizz.png', '2025-05-26 01:45:20', 30, 5, '2025-06-04 18:17:39'),
(13, 'Raspberry Spritzer', 115.00, 'Non Coffee', 'active', 'Sparkling raspberry flavored drink', '../assets/images/raspberry_pritzer.png', '2025-05-26 01:45:20', 25, 5, '2025-06-04 19:42:50'),
(14, 'Cucumber Mint Cooler', 120.00, 'Non Coffee', 'active', 'Refreshing cucumber and mint drink', '../assets/images/cucumber_mint_cooler.png', '2025-05-26 01:45:20', 30, 5, '2025-06-04 18:17:43'),
(15, 'Blueberry Basil Soda', 120.00, 'Non Coffee', 'active', 'Unique blueberry and basil flavored soda', '../assets/images/blueberry_basil_soda.png', '2025-05-26 01:45:20', 30, 5, '2025-06-04 18:17:46'),
(16, 'Donut', 80.00, 'Pastry', 'active', 'Classic glazed donut', '../assets/images/donut.png', '2025-05-26 01:45:20', 20, 5, '2025-06-04 18:17:52'),
(17, 'Apple Pie', 90.00, 'Pastry', 'active', 'Traditional apple pie with cinnamon', '../assets/images/apple_pie.png', '2025-05-26 01:45:20', 20, 5, '2025-06-04 18:17:55'),
(18, 'Cinnamon Roll', 70.00, 'Pastry', 'active', 'Sweet cinnamon roll with icing', '../assets/images/cinnamon_roll.png', '2025-05-26 01:45:20', 20, 5, '2025-06-04 18:17:57'),
(19, 'Sugar Cookie', 60.00, 'Pastry', 'active', 'Classic sugar cookie', '../assets/images/sugar_cookie.png', '2025-05-26 01:45:20', 20, 5, '2025-06-04 18:17:59'),
(20, 'Brownie', 75.00, 'Pastry', 'active', 'Rich chocolate brownie', '../assets/images/brownie.png', '2025-05-26 01:45:20', 20, 5, '2025-06-04 18:18:02'),
(21, 'BLT (Bacon, Lettuce, Tomato)', 180.00, 'Sandwich', 'active', 'Classic bacon, lettuce and tomato sandwich', '../assets/images/blt.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 18:18:05'),
(22, 'Club Sandwich', 190.00, 'Sandwich', 'active', 'Multi-layered sandwich with chicken, bacon and vegetables', '../assets/images/club_sandwich.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 18:18:09'),
(23, 'Grilled Cheese', 150.00, 'Sandwich', 'active', 'Grilled sandwich with melted cheese', '../assets/images/grilled_cheese.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 18:18:15'),
(24, 'Ham and Cheese Sandwich', 160.00, 'Sandwich', 'active', 'Classic ham and cheese combination', '../assets/images/ham_cheese_sandwich.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 18:18:19'),
(25, 'Tuna Salad Sandwich', 170.00, 'Sandwich', 'active', 'Fresh tuna salad on bread', '../assets/images/tuna_salad_sandwich.png', '2025-05-26 01:45:20', 12, 5, '2025-06-05 04:08:00'),
(26, 'Chocolate Cake', 200.00, 'Cake', 'active', 'Rich and moist chocolate cake', '../assets/images/chocolate_cake.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 20:42:54'),
(27, 'Cheesecake', 220.00, 'Cake', 'active', 'Creamy New York style cheesecake', '../assets/images/cheesecake.png', '2025-05-26 01:45:20', 15, 3, '2025-06-04 20:42:48'),
(28, 'Carrot Cake', 190.00, 'Cake', 'active', 'Moist carrot cake with cream cheese frosting', '../assets/images/carrot_cake.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 20:42:39'),
(29, 'Black Forest Cake', 210.00, 'Cake', 'active', 'Chocolate cake with cherries and whipped cream', '../assets/images/black_forest_cake.png', '2025-05-26 01:45:20', 15, 5, '2025-06-04 20:42:32'),
(30, 'Red Velvet Cake', 215.00, 'Cake', 'active', 'Classic red velvet cake with cream cheese frosting', '../assets/images/red_velvet_cake.png', '2025-05-26 01:45:20', 12, 5, '2025-06-04 22:11:02');

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
(41, 30, 10, 4, -6, 'DAMAGED', '', 1, '2025-05-28 00:19:31'),
(42, 1, 50, 49, -1, 'SOLD', 'Order #82 completed - deducted 1 units', 1, '2025-06-04 07:37:36'),
(43, 1, 49, 48, -1, 'SOLD', 'Order #82 completed - deducted 1 units', 1, '2025-06-04 07:37:36'),
(44, 3, 50, 49, -1, 'SOLD', 'Order #82 completed - deducted 1 units', 1, '2025-06-04 07:37:36'),
(45, 3, 49, 48, -1, 'SOLD', 'Order #82 completed - deducted 1 units', 1, '2025-06-04 07:37:36'),
(46, 29, 9, 0, -9, 'SOLD', 'Order #83 completed - deducted 9 units', 1, '2025-06-04 07:39:42'),
(47, 3, 48, 46, -2, 'SOLD', 'Order #84 completed - deducted 2 units', 1, '2025-06-04 07:39:45'),
(48, 2, 50, 49, -1, 'SOLD', 'Order #84 completed - deducted 1 units', 1, '2025-06-04 07:39:45'),
(49, 28, 15, 10, -5, 'SOLD', 'Order #85 completed - deducted 5 units', 1, '2025-06-04 07:41:29'),
(50, 2, 49, 0, -49, 'SOLD', '', 1, '2025-06-04 16:08:47'),
(51, 30, 0, 5, 5, 'RESTOCK', '', 1, '2025-06-04 16:12:01'),
(52, 29, 0, 5, 5, 'RESTOCK', '', 1, '2025-06-04 16:12:51'),
(53, 1, 48, 0, -48, 'SOLD', '', 1, '2025-06-04 16:37:29'),
(54, 30, 5, 0, -5, 'SOLD', '', 1, '2025-06-04 18:21:01'),
(55, 29, 5, 0, -5, 'SOLD', '', 1, '2025-06-04 18:21:27'),
(56, 6, 50, 49, -1, 'SOLD', 'Order #92 completed - deducted 1 units', 1, '2025-06-04 18:30:27'),
(57, 7, 50, 48, -2, 'SOLD', 'Order #93 completed - deducted 2 units', 1, '2025-06-04 18:31:13'),
(58, 28, 10, 5, -5, 'SOLD', 'Order #94 completed - deducted 5 units', 1, '2025-06-04 18:32:25'),
(59, 28, 5, 2, -3, 'SOLD', 'Order #98 completed - deducted 3 units', 1, '2025-06-04 18:46:44'),
(60, 3, 46, 45, -1, 'SOLD', 'Order #97 completed - deducted 1 units', 1, '2025-06-04 18:47:12'),
(61, 28, 2, 0, -2, 'SOLD', 'Order #99 completed - deducted 2 units', 1, '2025-06-04 18:47:54'),
(62, 27, 10, 0, -10, 'SOLD', 'Order #100 completed - deducted 11 units', 1, '2025-06-04 18:48:59'),
(63, 3, 45, 0, -45, 'SOLD', 'Order #101 completed - deducted 45 units', 1, '2025-06-04 18:50:09'),
(64, 13, 30, 25, -5, 'SOLD', 'Order #102 completed - deducted 5 units', 1, '2025-06-04 19:42:50'),
(65, 26, 10, 0, -10, 'SOLD', '', 1, '2025-06-04 19:44:07'),
(66, 30, 0, 3, 3, 'RESTOCK', '', 1, '2025-06-04 19:47:14'),
(67, 30, 3, 0, -3, 'SOLD', 'Order #103 completed - deducted 4 units', 1, '2025-06-04 20:00:37'),
(68, 25, 15, 3, -12, 'SOLD', '', 1, '2025-06-04 20:01:55'),
(69, 25, 3, 2, -1, 'SOLD', 'Order #105 completed - deducted 1 units', 1, '2025-06-04 20:21:28'),
(70, 30, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:42:18'),
(71, 29, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:42:32'),
(72, 28, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:42:39'),
(73, 27, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:42:48'),
(74, 26, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:42:54'),
(75, 3, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:43:00'),
(76, 2, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:43:07'),
(77, 1, 0, 15, 15, 'RESTOCK', '', 1, '2025-06-04 20:43:13'),
(78, 25, 2, 15, 13, 'RESTOCK', '', 1, '2025-06-04 20:43:38'),
(79, 3, 15, 14, -1, 'SOLD', 'Order #106 completed - deducted 1 units', 1, '2025-06-04 21:52:41'),
(80, 3, 14, 13, -1, 'SOLD', 'Order #106 completed - deducted 1 units', 1, '2025-06-04 21:52:41'),
(81, 30, 15, 12, -3, 'SOLD', 'Order #107 completed - deducted 3 units', 1, '2025-06-04 22:11:02'),
(82, 25, 15, 12, -3, 'SOLD', 'Order #104 completed - deducted 3 units', 1, '2025-06-05 04:08:00');

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
  MODIFY `emp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=378;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

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
