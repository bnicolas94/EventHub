import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function KPICard({ title, value, icon: Icon, description, trend, className }: KPICardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-slate-500 mt-1">
                        {trend && (
                            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                            </span>
                        )}
                        {trend && description && ' '}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
