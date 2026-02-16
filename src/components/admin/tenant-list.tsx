
'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChangePlanDialog } from './change-plan-dialog';

interface TenantProps {
    id: string;
    name: string;
    plan_name: string;
    plan_id: string;
    owner_email: string;
    created_at: string;
    is_active: boolean;
}

interface PlanProps {
    id: string;
    name: string;
    price_usd: number;
}

interface TenantListProps {
    initialTenants: any[];
    plans: any[];
}

export function TenantList({ initialTenants, plans }: TenantListProps) {
    const [tenants, setTenants] = useState<TenantProps[]>(initialTenants);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<TenantProps | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePlanChange = (tenantId: string, newPlanName: string, newPlanId: string) => {
        // Optimistic update
        setTenants(prev => prev.map(t =>
            t.id === tenantId ? { ...t, plan_name: newPlanName, plan_id: newPlanId } : t
        ));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950/50"
                />
            </div>

            <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-slate-300">Tenant</TableHead>
                            <TableHead className="text-slate-300">Owner</TableHead>
                            <TableHead className="text-slate-300">Plan Actual</TableHead>
                            <TableHead className="text-slate-300">Estado</TableHead>
                            <TableHead className="text-slate-300">Registro</TableHead>
                            <TableHead className="text-right text-slate-300">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-slate-400">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell className="font-medium text-white">{tenant.name}</TableCell>
                                    <TableCell className="text-slate-400">{tenant.owner_email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                                            {tenant.plan_name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tenant.is_active ? 'default' : 'secondary'} className={tenant.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : ""}>
                                            {tenant.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm">
                                        {format(new Date(tenant.created_at), 'dd MMM yyyy', { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTenant(tenant);
                                                setOpenDialog(true);
                                            }}
                                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                        >
                                            Cambiar Plan
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedTenant && (
                <ChangePlanDialog
                    open={openDialog}
                    onOpenChange={setOpenDialog}
                    tenant={selectedTenant}
                    plans={plans}
                    onSuccess={handlePlanChange}
                />
            )}
        </div>
    );
}
