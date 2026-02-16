import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestActivity } from '@/app/actions/dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';

interface RecentActivityProps {
    activities: GuestActivity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card className="bg-slate-900/50 border-white/10 h-full backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Actividad Reciente
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No hay actividad registrada aún.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                                <Avatar className="h-9 w-9 border border-white/10 bg-slate-800">
                                    <AvatarFallback className="text-xs text-slate-300">
                                        {activity.guestName.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">
                                        {activity.guestName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {getStatusIcon(activity.status)}
                                        <span className="text-xs text-slate-400">
                                            {getStatusText(activity.status)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-600 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true, locale: es })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'confirmed': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
        case 'declined': return <XCircle className="w-3 h-3 text-red-400" />;
        default: return <Clock className="w-3 h-3 text-amber-400" />;
    }
}

function getStatusText(status: string) {
    switch (status) {
        case 'confirmed': return 'Confirmó asistencia';
        case 'declined': return 'Rechazó la invitación';
        case 'pending': return 'Invitación pendiente';
        case 'opened': return 'Vio la invitación';
        default: return 'Actualizó su estado';
    }
}
