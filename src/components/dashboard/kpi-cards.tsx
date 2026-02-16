import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, ArrowRight } from 'lucide-react';
import { DashboardMetrics } from '@/app/actions/dashboard';

interface KpiCardsProps {
    metrics: DashboardMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Total Invitados
                    </CardTitle>
                    <Users className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{metrics.totalGuests}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        Lista completa
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Confirmados
                    </CardTitle>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">{metrics.confirmedGuests}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        Asistentes seguros
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Pendientes
                    </CardTitle>
                    <Clock className="w-4 h-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-400">{metrics.pendingGuests}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        Esperando respuesta
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Rechazados
                    </CardTitle>
                    <UserX className="w-4 h-4 text-red-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-400">{metrics.declinedGuests}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        No asistirán
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
