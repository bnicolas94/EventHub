
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SubscriptionPlan, PlanFeatures } from '@/lib/types';

export type PlanResource = 'events' | 'guests' | 'storage';
export type PlanFeature = keyof PlanFeatures;

/**
 * Obtiene el plan actual del tenant y sus límites.
 */
import { unstable_noStore as noStore } from 'next/cache';

export async function getTenantPlan(tenantId: string) {
    noStore();
    const supabase = await createServerSupabaseClient();

    // Obtenemos tenant con su plan relacional
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
            *,
            plan:subscription_plans(*)
        `)
        .eq('id', tenantId)
        .single();

    if (error || !tenant) {
        console.error('Error fetching tenant plan:', error);
        return null;
    }

    const rawPlan = tenant.plan;
    const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;

    return {
        tenant: {
            ...tenant,
            plan: plan as SubscriptionPlan
        },
        plan: plan as SubscriptionPlan
    };
}

/**
 * Verifica si un tenant puede crear un nuevo recurso según su plan.
 * Retorna true si está permitido, false si alcanzó el límite.
 */
export async function checkPlanLimits(tenantId: string, resource: PlanResource): Promise<{ allowed: boolean; message?: string }> {
    const data = await getTenantPlan(tenantId);
    if (!data?.plan) return { allowed: false, message: 'Plan no encontrado' };

    const { plan, tenant } = data;
    const supabase = await createServerSupabaseClient();

    if (resource === 'events') {
        const limit = plan.max_events;
        // Contamos solo eventos activos (no archivados) para cumplir con el PRD "1 evento activo"
        const { count, error } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .neq('status', 'archived');

        if (error) {
            console.error('Error counting events:', error);
            return { allowed: false, message: 'Error al verificar límites' };
        }

        if ((count || 0) >= limit) {
            return {
                allowed: false,
                message: `Has alcanzado el límite de ${limit} evento(s) activo(s) de tu plan ${plan.name}. Archiva eventos antiguos o actualiza tu plan.`
            };
        }
    }

    if (resource === 'guests') {
        // Verificamos límite POR EVENTO o GLOBAL? 
        // PRD: "Hasta 50 invitados" (parece ser por evento, pero el plan está en el tenant).
        // DB schema: max_guests está en subscription_plans.
        // Interpretación: max_guests es el límite de invitados POR EVENTO.
        // PERO, checkPlanLimits se suele llamar antes de crear, o sea, valida el evento actual.
        // Si es una validación global, sería complejo.
        // Vamos a asumir que se valida contra el evento actual al momento de añadir invitados.
        // Esta función 'checkPlanLimits' genérica tal vez no sirva para guests sin el eventId.
        // Dejaremos 'guests' para una función más específica o requeriremos eventId.

        // Corrección: El límite es por evento según lógica estándar SaaS de eventos, 
        // pero la tabla plans dice "max_guests" integer.
        // Vamos a retornar true aquí y manejar la lógica específica en 'checkEventGuestLimit'.
        return { allowed: true };
    }

    if (resource === 'storage') {
        const limitMb = plan.storage_quota_mb;
        const usedMb = tenant.storage_used_mb || 0;

        if (usedMb >= limitMb) {
            return {
                allowed: false,
                message: `Has alcanzado el límite de almacenamiento de ${limitMb}MB. Actualiza tu plan para subir más fotos.`
            };
        }
    }

    return { allowed: true };
}

/**
 * Verifica si el evento específico ha alcanzado el límite de invitados del plan.
 */
export async function checkEventGuestLimit(tenantId: string, eventId: string, guestsToAdd = 1): Promise<{ allowed: boolean; message?: string }> {
    const data = await getTenantPlan(tenantId);
    if (!data?.plan) return { allowed: false, message: 'Plan no encontrado' };

    const limit = data.plan.max_guests;
    const supabase = await createServerSupabaseClient();

    const { count, error } = await supabase
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

    if (error) {
        return { allowed: false, message: 'Error verificando invitados' };
    }

    if (((count || 0) + guestsToAdd) > limit) {
        return {
            allowed: false,
            message: `El plan ${data.plan.name} permite hasta ${limit} invitados por evento.`
        };
    }

    return { allowed: true };
}

/**
 * Verifica si el plan tiene habilitada una feature específica.
 */
export async function hasPlanFeature(tenantId: string, feature: PlanFeature): Promise<boolean> {
    const data = await getTenantPlan(tenantId);
    if (!data?.plan) return false;

    const features = data.plan.features as PlanFeatures;
    return !!features[feature];
}
