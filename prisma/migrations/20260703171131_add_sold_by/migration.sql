-- AlterTable
ALTER TABLE `clientservice` ADD COLUMN `soldById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ClientService` ADD CONSTRAINT `ClientService_soldById_fkey` FOREIGN KEY (`soldById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

