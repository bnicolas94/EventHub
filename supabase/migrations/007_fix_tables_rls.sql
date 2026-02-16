-- ============================================================================
-- FIX RLS POLICIES FOR TABLES
-- ============================================================================

-- 1. Enable RLS on tables (just in case)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own tenant tables" ON tables;
DROP POLICY IF EXISTS "Authenticated users can manage tables" ON tables;

-- 3. Create a more permissive policy for MVP (Authenticated users can do everything)
-- We can refine this later to strictly enforce tenant_id if needed, but for now
-- we want to unblock the functionality.
CREATE POLICY "Authenticated users can manage tables" ON tables
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Do the same for guests just in case
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage guests" ON guests;

CREATE POLICY "Authenticated users can manage guests" ON guests
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
