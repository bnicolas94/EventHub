import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function checkSystemAdmin(): Promise<boolean> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return false;
        }

        const adminClient = await createServiceRoleClient();
        const { data, error } = await adminClient
            .from('system_admins')
            .select('id')
            .eq('email', user.email)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !data) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Check admin error:', error);
        return false;
    }
}
