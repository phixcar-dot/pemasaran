-- AlterTable: tambah kolom uploadedBy ke tabel imports
ALTER TABLE `imports` ADD COLUMN `uploadedBy` VARCHAR(100) NOT NULL DEFAULT '';
