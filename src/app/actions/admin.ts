
'use server';

import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { checkSystemAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function getTenants() {
    const isAdmin = await checkSystemAdmin();
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    const supabase = await createServiceRoleClient(); // Usar Service Role como solicitado

    const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
            *,
            plan:subscription_plans(*),
            users:users(email)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tenants:', error);
        return { success: false, error: error.message };
    }

    // Simplificar estructura para el frontend
    const formattedTenants = tenants.map(t => ({
        id: t.id,
        name: t.name,
        plan_name: t.plan?.name || 'Desconocido',
        plan_id: t.plan_id,
        owner_email: t.users?.[0]?.email || 'Sin usuario', // Asumiendo 1er usuario es owner
        created_at: t.created_at,
        is_active: t.subscription_status === 'active'
    }));

    return { success: true, data: formattedTenants };
}

export async function getPlans() {
    const isAdmin = await checkSystemAdmin();
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    const supabase = await createServiceRoleClient();

    const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: plans };
}

export async function updateTenantPlan(tenantId: string, newPlanId: string) {
    console.log(`[AdminAction] Request to update tenant ${tenantId} to plan ${newPlanId}`);

    const isAdmin = await checkSystemAdmin();
    if (!isAdmin) {
        console.error('[AdminAction] Unauthorized access attempt');
        return { success: false, error: 'No autorizado' };
    }

    const supabase = await createServiceRoleClient();

    // 1. Verify existence of plan
    const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('id', newPlanId)
        .single();

    if (planError || !plan) {
        console.error('[AdminAction] Plan not found:', newPlanId, planError);
        return { success: false, error: 'Plan no encontrado' };
    }

    // 2. Update tenant
    const { error, data } = await supabase
        .from('tenants')
        .update({
            plan_id: newPlanId,
            updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
        .select();

    if (error) {
        console.error('[AdminAction] Error updating tenant plan:', error);
        return { success: false, error: error.message };
    }

    console.log('[AdminAction] Success. Tenant updated:', data);

    revalidatePath('/admin');
    revalidatePath('/admin/tenants');
    revalidatePath('/dashboard'); // Update user dashboard too

    return { success: true };
}

export async function updateSubscriptionPlan(planId: string, data: any) {
    console.log(`[AdminAction] Request to update plan ${planId}`, data);

    const isAdmin = await checkSystemAdmin();
    if (!isAdmin) {
        console.error('[AdminAction] Unauthorized access attempt');
        return { success: false, error: 'No autorizado' };
    }

    const supabase = await createServiceRoleClient();

    const { error } = await supabase
        .from('subscription_plans')
        .update({
            price_usd: data.price_usd,
            max_events: data.max_events,
            max_guests: data.max_guests,
            storage_quota_mb: data.storage_quota_mb,
            features: data.features,
            updated_at: new Date().toISOString()
        })
        .eq('id', planId);

    if (error) {
        console.error('[AdminAction] Error updating subscription plan:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/plans');
    revalidatePath('/dashboard');

    return { success: true };
}
