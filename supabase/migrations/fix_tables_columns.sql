-- SQL para corregir la tabla 'tables' y 'guests'
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Agregar columnas visuales a la tabla 'tables'
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS shape text DEFAULT 'round',
ADD COLUMN IF NOT EXISTS x numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS y numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS rotation numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS seats integer DEFAULT 8;

-- 2. Asegurar que la tabla 'guests' tenga la referencia a mesas
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES tables(id) ON DELETE SET NULL;
