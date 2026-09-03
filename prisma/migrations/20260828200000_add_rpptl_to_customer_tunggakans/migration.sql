-- Migration: tambah kolom rpptl ke customer_tunggakans
-- Kolom rpptl menyimpan nilai nominal tagihan (rupiah) per pelanggan
-- DEFAULT 0 memastikan data existing tetap valid
-- Decimal(15,0): mendukung nilai hingga 999.999.999.999.999 tanpa desimal

ALTER TABLE `customer_tunggakans`
  ADD COLUMN `rpptl` DECIMAL(15, 0) NOT NULL DEFAULT 0
  AFTER `lembar`;
