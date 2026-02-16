// ============================================================================
// EventHub — Core TypeScript Types
// ============================================================================

// ─── System Admin ───────────────────────────────────────────────────────────

export interface SystemAdmin {
    id: string;
    email: string;
    full_name: string | null;
    is_active: boolean;
    created_at: string;
}

// ─── Subscription Plans ─────────────────────────────────────────────────────

export interface PlanFeatures {
    tables: boolean;
    ai_suggestions: boolean;
    custom_branding: boolean;
    csv_import: boolean;
    mass_communications: boolean;
    advanced_reports: boolean;
    photo_moderation: boolean;
    custom_domain: boolean;
    sms_notifications: boolean;
    timeline: boolean;
    [key: string]: boolean;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    price_usd: number;
    max_guests: number;
    max_events: number;
    storage_quota_mb: number;
    features: PlanFeatures;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ─── Tenant ─────────────────────────────────────────────────────────────────

export interface Tenant {
    id: string;
    name: string;
    plan_id: string | null;
    storage_used_mb: number;
    created_at: string;
    updated_at: string;
    // Relations
    plan?: SubscriptionPlan;
}

// ─── User (Organizer within a Tenant) ───────────────────────────────────────

export type UserRole = 'tenant_owner' | 'organizer' | 'collaborator';

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    permissions: Record<string, boolean>;
    created_at: string;
    // Relations
    tenant?: Tenant;
}

// ─── Event ──────────────────────────────────────────────────────────────────

export type EventType = 'wedding' | 'quinceanera' | 'birthday' | 'corporate' | 'anniversary' | 'other';
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface EventSettings {
    branding?: {
        primary_color?: string;
        logo_url?: string;
        background_url?: string;
    };
    notifications?: {
        email_on_rsvp?: boolean;
        auto_reminder?: boolean;
        reminder_days_before?: number;
    };
    photos?: {
        enabled?: boolean;
        auto_approve?: boolean;
        max_per_guest?: number;
        max_file_size_mb?: number;
    };
    [key: string]: unknown;
}

export interface InvitationDesign {
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    elements: InvitationElement[];
    background?: {
        type: 'color' | 'image' | 'gradient';
        src?: string;
        color?: string;
        gradient?: string;
    };
}

export interface InvitationElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    // Text-specific
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    isDynamic?: boolean; // for variables like {nombre_invitado}
    // Image-specific
    src?: string;
    // Shape-specific
    shapeType?: 'rectangle' | 'circle' | 'line';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface Event {
    id: string;
    tenant_id: string;
    name: string;
    event_type: EventType | null;
    date: string | null;
    end_date: string | null;
    location_name: string | null;
    location_address: string | null;
    location_coordinates: { x: number; y: number } | null;
    dress_code: string | null;
    custom_message: string | null;
    max_guests: number;
    status: EventStatus;
    settings: EventSettings;
    invitation_design: InvitationDesign | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Guest ──────────────────────────────────────────────────────────────────

export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'tentative';

export interface DietaryRestrictions {
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    is_lactose_intolerant?: boolean;
    allergies?: string[];
    other_notes?: string;
}

export interface Guest {
    id: string;
    event_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    invitation_token: string;
    rsvp_status: RSVPStatus;
    plus_ones_allowed: number;
    plus_ones_confirmed: number;
    plus_ones_names: string[];
    dietary_restrictions: DietaryRestrictions;
    group_name: string | null;
    table_id: string | null;
    custom_fields: Record<string, unknown>;
    invitation_sent_at: string | null;
    invitation_opened_at: string | null;
    responded_at: string | null;
    notes: string | null;
    created_at: string;
}

// ─── Table ──────────────────────────────────────────────────────────────────

export type TableShape = 'round' | 'rectangular' | 'square';

export interface EventTable {
    id: string;
    event_id: string;
    table_number: number;
    label: string | null;
    capacity: number;
    shape: TableShape;
    x_position: number;
    y_position: number;
    rotation: number;
    notes: string | null;
    created_at: string;
    // Relations
    guests?: Guest[];
}

// ─── Photo ──────────────────────────────────────────────────────────────────

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface PhotoMetadata {
    original_filename?: string;
    width?: number;
    height?: number;
    mime_type?: string;
}

export interface Photo {
    id: string;
    event_id: string;
    uploaded_by_guest_id: string | null;
    file_path: string;
    thumbnail_path: string | null;
    file_size_bytes: number;
    moderation_status: ModerationStatus;
    metadata: PhotoMetadata;
    uploaded_at: string;
    // Relations
    uploader?: Guest;
}

// ─── Communication ──────────────────────────────────────────────────────────

export type CommunicationType = 'invitation' | 'reminder' | 'announcement';
export type CommunicationStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface Communication {
    id: string;
    event_id: string;
    type: CommunicationType;
    subject: string | null;
    content: string | null;
    template_html: string | null;
    sent_at: string | null;
    scheduled_at: string | null;
    recipients_count: number;
    status: CommunicationStatus;
    metadata: Record<string, unknown>;
    created_at: string;
}

// ─── Invitation Template ────────────────────────────────────────────────────

export interface InvitationTemplate {
    id: string;
    name: string;
    category: EventType | null;
    thumbnail_url: string | null;
    design_data: InvitationDesign;
    is_premium: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

// ─── Guest Conflict ─────────────────────────────────────────────────────────

export type ConflictType = 'cannot_sit' | 'must_sit_together';

export interface GuestConflict {
    id: string;
    event_id: string;
    guest_a_id: string;
    guest_b_id: string;
    conflict_type: ConflictType;
    created_at: string;
}

// ─── Checklist ──────────────────────────────────────────────────────────────

export interface ChecklistItem {
    id: string;
    event_id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    sort_order: number;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
}

// ─── Dashboard Metrics ──────────────────────────────────────────────────────

export interface EventMetrics {
    total_guests: number;
    confirmed: number;
    declined: number;
    pending: number;
    tentative: number;
    confirmation_rate: number;
    plus_ones_total: number;
    photos_count: number;
    photos_pending: number;
    tables_count: number;
    unassigned_guests: number;
}

// ─── Auth Session ───────────────────────────────────────────────────────────

export interface AuthSession {
    user: User;
    tenant: Tenant;
    isSystemAdmin: boolean;
}
