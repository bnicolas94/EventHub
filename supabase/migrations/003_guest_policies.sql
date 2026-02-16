-- ============================================================================
-- GUEST MANAGEMENT SECURITY
-- ============================================================================

-- 1. Enable RLS on guests (if not already enabled)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Users can VIEW guests of their own tenant's events
-- Logic: Guest -> Event -> Tenant -> User must belong to Tenant
CREATE POLICY "Users can view own tenant guests" ON guests
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- 3. Create Policy: Users can INSERT guests to their own tenant's events
CREATE POLICY "Users can insert own tenant guests" ON guests
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- 4. Create Policy: Users can UPDATE guests of their own tenant's events
CREATE POLICY "Users can update own tenant guests" ON guests
  FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- 5. Create Policy: Users can DELETE guests of their own tenant's events
CREATE POLICY "Users can delete own tenant guests" ON guests
  FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );
