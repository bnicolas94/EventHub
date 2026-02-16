
import { getTenants, getPlans } from '@/app/actions/admin';
import { TenantList } from '@/components/admin/tenant-list';

export default async function AdminPage() {
    // Fetch data in parallel
    const [tenantsResult, plansResult] = await Promise.all([
        getTenants(),
        getPlans()
    ]);

    const tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : [];
    const plans = plansResult.success && plansResult.data ? plansResult.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Tenants</h1>
                <p className="text-slate-400">
                    Administra las suscripciones y estados de todos los clientes de la plataforma.
                </p>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-lg p-6">
                <TenantList initialTenants={tenants} plans={plans} />
            </div>
        </div>
    );
}
