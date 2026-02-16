# Feature Gating & Limits Enforcement Plan

## Goal
Restrict access to premium features and enforce usage limits for tenants on the "Free" plan.

## User Review Required
> [!IMPORTANT]
> **Immediate Access Block**: Users currently on the Free plan who were using premium features will lose access immediately. Gating banners will appear.

## Proposed Changes

### 1. New Utility: `verifyFeatureAccess`
Create a server-side utility in `src/lib/gating.ts` to easily protect routes and actions.

### 2. Server-Side Route Protection
Wrap the following pages to show a locked state if the feature is disabled:

#### `src/app/(dashboard)/dashboard/tables/page.tsx`
- **Feature**: `tables`
- **Action**: Check feature. If missing, render `<FeatureGate>` with banner.

#### `src/app/(dashboard)/dashboard/analytics/page.tsx`
- **Feature**: `advanced_reports`
- **Action**: Check feature.

#### `src/app/(dashboard)/dashboard/invitations/page.tsx`
- **Feature**: `mass_communications` or `sms_notifications`
- **Action**: Check feature.

#### `src/app/(dashboard)/dashboard/timeline/page.tsx`
- **Feature**: `tables` (as proxy for premium planning/scheduling)
- **Action**: Check feature.

### 3. Component-Level Gating
UI elements triggering premium actions must be gated.

#### `src/app/(dashboard)/dashboard/guests/page.tsx`
- **Import Button**: Wrap `ImportGuestsDialog` trigger with `<FeatureGate feature="csv_import">`.
- **Send Invitations**: Wrap `SendInvitationsDialog` trigger with `<FeatureGate feature="mass_communications">`.

### 4. Usage Limits Enforcement
Ensure backend actions verify counts before creation.

#### `src/app/actions/events.ts`
- `createEvent`: Verify `max_events` limit.

#### `src/app/actions/photos.ts`
- `uploadPhoto`: Call `checkPlanLimits(tenantId, 'storage')`.
- `updatePhotoStatus`: Verify `photo_moderation` feature.

#### `src/app/actions/tables.ts`
- Gate all mutation actions with `verifyFeatureAccess('tables')`.

#### `src/app/actions/guests.ts`
- `importGuests`: Check limit against (current + new).

### 5. Global Navigation UX
- Add a toast/modal in `DashboardShell` when `?upgrade=true` is detected.

## Verification Plan

### Manual Verification
1. **Free Tenant Test**:
    - **Tables**: Go to `/dashboard/tables`. Expect "Upgrade" banner.
    - **Import Guests**: Go to `/dashboard/guests`. Click "Importar Excel". Expect lock/upgrade prompt.
    - **Create Event**: Try to create 2nd event. Expect error.
    - **Add Guest**: Try to add >50 guests. Expect error.

2. **Enterprise Tenant Test**:
    - Switch tenant to Enterprise.
    - Verify all above pages/actions work normally.
