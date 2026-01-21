-- Drop the old foreign key constraint
ALTER TABLE user_inventory 
  DROP CONSTRAINT IF EXISTS user_inventory_resin_id_fkey;

-- Add new foreign key constraint to resin_catalog
ALTER TABLE user_inventory 
  ADD CONSTRAINT user_inventory_resin_catalog_fkey 
  FOREIGN KEY (resin_id) REFERENCES resin_catalog(id) ON DELETE CASCADE;