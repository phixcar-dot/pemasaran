-- CreateTable
CREATE TABLE `imports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(255) NOT NULL,
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_tunggakans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `importId` INTEGER NOT NULL,
    `unitap` VARCHAR(100) NOT NULL,
    `unitup` VARCHAR(100) NOT NULL,
    `idpel` VARCHAR(50) NOT NULL,
    `kogol` VARCHAR(50) NOT NULL,
    `lembar` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_tunggakans` ADD CONSTRAINT `customer_tunggakans_importId_fkey` FOREIGN KEY (`importId`) REFERENCES `imports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
