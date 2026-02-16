-- ============================================================================
-- SECURITY UPDATES & SEEDS
-- ============================================================================

-- 1. Enable RLS on sensitive tables
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for system_admins
-- Default: No access (deny all) unless using service_role.
-- This prevents 'anon' or authenticated users from reading the admin list API.

-- 3. Create Policies for subscription_plans
-- Public read access (for registration page and checks)
CREATE POLICY "Public read plans" ON subscription_plans
  FOR SELECT USING (true);

-- No public write/update access (managed via service_role in Admin Panel)

-- 4. Seed initial System Admin
-- Replace 'admin@eventhub.app' with your registration email if different.
INSERT INTO system_admins (email, password_hash)
VALUES ('admin@eventhub.app', 'managed_by_supabase_auth')
ON CONFLICT (email) DO NOTHING;

-- 5. Fix users table permissions if not set
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Each user can read/update their own profile
CREATE POLICY "Users can manage own profile" ON users
  USING (auth.uid() = auth_id);

-- 6. Fix tenants table permissions
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- Tenants readable by their members (users)
CREATE POLICY "Users can read own tenant" ON tenants
  USING (
    id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- 7. Fix events table permissions
CREATE POLICY "Users can manage tenant events" ON events
  USING (
    tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_id = auth.uid()
    )
  );
