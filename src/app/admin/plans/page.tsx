
import { getPlans } from '@/app/actions/admin';
import { PlanList } from '@/components/admin/plan-list';

export default async function PlansPage() {
    const plansResult = await getPlans();
    const plans = plansResult.success && plansResult.data ? plansResult.data : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Planes</h1>
                <p className="text-slate-400">
                    Visualiza y modifica la configuración de los planes de suscripción.
                </p>
            </div>

            <PlanList initialPlans={plans} />
        </div>
    );
}
