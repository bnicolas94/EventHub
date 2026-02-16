'use client';

import { Guest } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Mail,
    MessageCircle,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Link as LinkIcon
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { deleteGuest } from '@/app/actions/guests';
import { sendGuestInvitation as sendEmailInvitation } from '@/app/actions/emails';
import { toast } from 'sonner';
import { GuestFormDialog } from '@/components/guests/guest-form-dialog';

interface GuestTableProps {
    guests: Guest[];
}

export function GuestTable({ guests }: GuestTableProps) {

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este invitado?')) {
            const res = await deleteGuest(id);
            if (res.success) {
                toast.success('Invitado eliminado');
            } else {
                toast.error(res.error || 'Error al eliminar');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmado</Badge>;
            case 'declined':
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1"><XCircle className="w-3 h-3" /> Rechazado</Badge>;
            case 'opened':
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1"><Eye className="w-3 h-3" /> Visto</Badge>;
            default: // pending
                return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 gap-1"><Clock className="w-3 h-3" /> Pendiente</Badge>;
        }
    };

    if (guests.length === 0) {
        return (
            <div className="text-center py-20 border border-white/5 rounded-xl bg-white/[0.02]">
                <p className="text-slate-400">No hay invitados aún.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-white/5">
                        <TableHead className="text-slate-300">Invitado</TableHead>
                        <TableHead className="text-slate-300">Estado</TableHead>
                        <TableHead className="text-slate-300">Categoría</TableHead>
                        <TableHead className="text-slate-300">Acompañantes</TableHead>
                        <TableHead className="text-right text-slate-300">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {guests.map((guest) => (
                        <TableRow key={guest.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 bg-slate-800 border border-white/10">
                                        <AvatarFallback className="bg-slate-700 text-xs text-white">
                                            {guest.full_name?.substring(0, 2) || 'G'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-white">{guest.full_name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500">{guest.email || guest.phone || 'Sin contacto'}</p>
                                            {guest.invitation_sent_at && (
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                                                    Enviado
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(guest.rsvp_status)}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="border-white/10 text-slate-400 font-normal">
                                    {guest.group_name || 'General'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">
                                {guest.plus_ones_confirmed || 0} / {guest.plus_ones_allowed}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <GuestFormDialog
                                            eventId={guest.event_id}
                                            guestToEdit={guest}
                                            trigger={
                                                <DropdownMenuItem
                                                    className="focus:bg-white/10 cursor-pointer"
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                            }
                                        />
                                        <DropdownMenuItem
                                            className="focus:bg-white/10 cursor-pointer"
                                            onClick={() => {
                                                const url = `${window.location.origin}/rsvp/${guest.invitation_token}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('Link de invitación copiado');
                                            }}
                                        >
                                            <LinkIcon className="mr-2 h-4 w-4" /> Copiar Link RSVP
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem
                                            className="focus:bg-white/10 cursor-pointer text-blue-400"
                                            onClick={async () => {
                                                const promise = sendEmailInvitation(guest.id);
                                                toast.promise(promise, {
                                                    loading: 'Enviando invitación...',
                                                    success: (res: any) => {
                                                        if (res.success) return 'Invitación enviada con éxito';
                                                        throw new Error(res.error);
                                                    },
                                                    error: (err) => err.message || 'Error al enviar invitación'
                                                });
                                            }}
                                        >
                                            <Mail className="mr-2 h-4 w-4" /> Enviar Email
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="focus:bg-white/10 cursor-pointer text-green-400"
                                            onClick={() => {
                                                const url = `${window.location.origin}/rsvp/${guest.invitation_token}`;
                                                const message = `¡Hola ${guest.full_name}! Te invitamos a nuestro evento. Por favor confirma tu asistencia aquí: ${url}`;
                                                const encodedMessage = encodeURIComponent(message);
                                                const whatsappUrl = `https://wa.me/${guest.phone?.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
                                                window.open(whatsappUrl, '_blank');
                                            }}
                                        >
                                            <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem
                                            className="focus:bg-red-500/20 text-red-400 cursor-pointer focus:text-red-300"
                                            onClick={() => handleDelete(guest.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
