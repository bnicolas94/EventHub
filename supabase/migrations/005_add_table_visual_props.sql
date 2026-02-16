-- Add visual properties to tables for drag & drop interface
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS shape text DEFAULT 'round',
ADD COLUMN IF NOT EXISTS x numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS y numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rotation numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS seats integer DEFAULT 8;
