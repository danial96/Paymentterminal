-- AlterTable
ALTER TABLE `client` ADD COLUMN `isFresher` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `clientservice` ADD COLUMN `externalRef` VARCHAR(191) NULL,
    ADD COLUMN `upsellerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `externalRef` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SyncLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ranAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rowsProcessed` INTEGER NOT NULL,
    `clientsCreated` INTEGER NOT NULL,
    `clientsUpdated` INTEGER NOT NULL,
    `servicesUpserted` INTEGER NOT NULL,
    `warnings` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ClientService_externalRef_key` ON `ClientService`(`externalRef`);

-- CreateIndex
CREATE UNIQUE INDEX `Payment_externalRef_key` ON `Payment`(`externalRef`);

-- AddForeignKey
ALTER TABLE `ClientService` ADD CONSTRAINT `ClientService_upsellerId_fkey` FOREIGN KEY (`upsellerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

