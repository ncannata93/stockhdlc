-- Add pack_size column to products_arg table
-- pack_size represents how many units are in a single pack (e.g., 12 liters per pack of milk)
-- NULL or 0 means no pack size is defined for that product
ALTER TABLE products_arg ADD COLUMN IF NOT EXISTS pack_size integer DEFAULT 0;
