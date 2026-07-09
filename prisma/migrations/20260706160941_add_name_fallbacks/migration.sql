-- AlterTable
ALTER TABLE `client` ADD COLUMN `frontSellerName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `clientservice` ADD COLUMN `soldByName` VARCHAR(191) NULL,
    ADD COLUMN `upsellerName` VARCHAR(191) NULL;

