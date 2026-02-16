-- ============================================================================
-- EventHub — Initial Database Migration
-- ============================================================================

-- ★ System Admins (dueños del sistema EventHub)
CREATE TABLE system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ★ Subscription Plans (gestionados por el System Owner)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(20) UNIQUE NOT NULL,
  price_usd DECIMAL(10,2) DEFAULT 0,
  max_guests INTEGER DEFAULT 50,
  max_events INTEGER DEFAULT 1,
  storage_quota_mb INTEGER DEFAULT 500,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (organizaciones/cuentas)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (organizadores dentro de un tenant)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, -- FK a Supabase Auth user
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'organizer',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50),
  date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location_name VARCHAR(255),
  location_address TEXT,
  location_coordinates POINT,
  dress_code VARCHAR(100),
  custom_message TEXT,
  max_guests INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  invitation_design JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables (mesas) — created before guests for FK
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  label VARCHAR(100),
  capacity INTEGER DEFAULT 8,
  shape VARCHAR(20) DEFAULT 'round',
  x_position FLOAT DEFAULT 0,
  y_position FLOAT DEFAULT 0,
  rotation FLOAT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests (invitados)
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  invitation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  rsvp_status VARCHAR(20) DEFAULT 'pending',
  plus_ones_allowed INTEGER DEFAULT 0,
  plus_ones_confirmed INTEGER DEFAULT 0,
  plus_ones_names JSONB DEFAULT '[]',
  dietary_restrictions JSONB DEFAULT '{}',
  group_name VARCHAR(100),
  table_assignment_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  invitation_sent_at TIMESTAMPTZ,
  invitation_opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by_guest_id UUID REFERENCES guests(id),
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size_bytes BIGINT,
  moderation_status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  template_html TEXT,
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitation Templates (plantillas prediseñadas)
CREATE TABLE invitation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  thumbnail_url TEXT,
  design_data JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest Conflicts (restricciones de mesas)
CREATE TABLE guest_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_a_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  guest_b_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  conflict_type VARCHAR(20) DEFAULT 'cannot_sit',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_a_id, guest_b_id)
);

-- Checklist Items
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_status ON events(tenant_id, status);
CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_token ON guests(invitation_token);
CREATE INDEX idx_guests_rsvp ON guests(event_id, rsvp_status);
CREATE INDEX idx_tables_event ON tables(event_id);
CREATE INDEX idx_photos_event ON photos(event_id);
CREATE INDEX idx_photos_moderation ON photos(event_id, moderation_status);
CREATE INDEX idx_communications_event ON communications(event_id);
CREATE INDEX idx_checklist_event ON checklist_items(event_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA — Default Subscription Plans
-- ============================================================================

INSERT INTO subscription_plans (name, slug, price_usd, max_guests, max_events, storage_quota_mb, features, sort_order) VALUES
(
  'Free', 'free', 0.00, 50, 1, 500,
  '{"tables": false, "ai_suggestions": false, "custom_branding": false, "csv_import": false, "mass_communications": false, "advanced_reports": false, "photo_moderation": true, "custom_domain": false, "sms_notifications": false}',
  1
),
(
  'Pro', 'pro', 49.00, 200, 10, 5120,
  '{"tables": true, "ai_suggestions": true, "custom_branding": true, "csv_import": true, "mass_communications": true, "advanced_reports": true, "photo_moderation": true, "custom_domain": false, "sms_notifications": false}',
  2
),
(
  'Enterprise', 'enterprise', 199.00, 99999, 99999, 51200,
  '{"tables": true, "ai_suggestions": true, "custom_branding": true, "csv_import": true, "mass_communications": true, "advanced_reports": true, "photo_moderation": true, "custom_domain": true, "sms_notifications": true}',
  3
);
