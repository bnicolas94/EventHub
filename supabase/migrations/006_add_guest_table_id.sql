-- Add table_id to guests for table assignment
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES tables(id) ON DELETE SET NULL;
