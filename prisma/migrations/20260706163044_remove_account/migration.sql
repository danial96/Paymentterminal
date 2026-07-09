-- DropForeignKey
ALTER TABLE `Client` DROP FOREIGN KEY `Client_accountId_fkey`;

-- AlterTable
ALTER TABLE `Client` DROP COLUMN `accountId`;

-- DropTable
DROP TABLE `Account`;
