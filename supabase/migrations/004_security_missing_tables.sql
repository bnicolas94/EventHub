-- ============================================================================
-- CHECKLIST & OTHER TABLES SECURITY
-- ============================================================================

-- 1. Policies for checklist_items
CREATE POLICY "Users can manage own tenant checklist" ON checklist_items
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- 2. Policies for tables (mesas)
CREATE POLICY "Users can manage own tenant tables" ON tables
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- 3. Policies for photos
CREATE POLICY "Users can manage own tenant photos" ON photos
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Public can upload photos (if we want guests to upload without login)
CREATE POLICY "Public can insert photos" ON photos
  FOR INSERT
  WITH CHECK (true);

-- 4. Policies for communications
CREATE POLICY "Users can manage own tenant communications" ON communications
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
      )
    )
  );
