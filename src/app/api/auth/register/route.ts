import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_id, email, full_name, org_name } = body;

        if (!auth_id || !email || !full_name || !org_name) {
            return NextResponse.json(
                { message: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        const supabase = await createServiceRoleClient();

        // 1. Get the free plan
        const { data: freePlan, error: planError } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', 'free')
            .single();

        if (planError || !freePlan) {
            return NextResponse.json(
                { message: 'Error al obtener el plan gratuito' },
                { status: 500 }
            );
        }

        // 2. Create tenant
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name: org_name,
                plan_id: freePlan.id,
            })
            .select()
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json(
                { message: 'Error al crear la organización: ' + tenantError?.message },
                { status: 500 }
            );
        }

        // 3. Create user with tenant_owner role
        const { error: userError } = await supabase
            .from('users')
            .insert({
                auth_id,
                tenant_id: tenant.id,
                email,
                full_name,
                role: 'tenant_owner',
                permissions: {},
            });

        if (userError) {
            // Cleanup tenant if user creation fails
            await supabase.from('tenants').delete().eq('id', tenant.id);
            return NextResponse.json(
                { message: 'Error al crear el usuario: ' + userError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tenant_id: tenant.id
        });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
