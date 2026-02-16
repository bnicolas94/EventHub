
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PlanFeatures } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

import { getTenantPlan } from './plans';

export async function getTenantFeatures(tenantId: string): Promise<PlanFeatures | null> {
    const data = await getTenantPlan(tenantId);
    if (!data?.plan) return null;
    return data.plan.features as PlanFeatures;
}

export async function verifyFeatureAccess(feature: keyof PlanFeatures): Promise<boolean> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) return false;

    const features = await getTenantFeatures(tenantUser.tenant_id);
    if (!features) return false;

    return features[feature] === true;
}

export async function checkFeatureAccessOrRedirect(feature: keyof PlanFeatures, redirectPath: string = '/dashboard') {
    const hasAccess = await verifyFeatureAccess(feature);

    if (!hasAccess) {
        // We could redirect to a specific upgrade page or just back to dashboard with a query param
        redirect(redirectPath + '?upgrade=true');
    }
}

// Re-export limit checks wrapper if needed, or implement here to keep all gating logic together
// For now, limits are in plans.ts, features here.
