-- SQL script για ενημέρωση του πίνακα olive_sales
-- Προσθήκη των πεδίων: customer_id, delivered, paid

-- Προσθήκη των νέων στηλών
ALTER TABLE `olive_sales`
  ADD COLUMN `customer_id` int(11) DEFAULT NULL AFTER `season_id`,
  ADD COLUMN `delivered` tinyint(1) NOT NULL DEFAULT 0 AFTER `notes`,
  ADD COLUMN `paid` tinyint(1) NOT NULL DEFAULT 0 AFTER `delivered`;

-- Προσθήκη index για customer_id
ALTER TABLE `olive_sales`
  ADD KEY `idx_customer_id` (`customer_id`);

-- Προσθήκη foreign key constraint για customer_id
ALTER TABLE `olive_sales`
  ADD CONSTRAINT `olive_sales_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;
