-- AlterTable
ALTER TABLE `servicetype` ADD COLUMN `category` ENUM('website', 'hosting', 'security', 'seo', 'other') NOT NULL DEFAULT 'other';

