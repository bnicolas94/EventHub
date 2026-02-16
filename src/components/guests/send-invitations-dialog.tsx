'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { sendBulkInvitations } from '@/app/actions/communications';
import { toast } from 'sonner';

interface SendInvitationsDialogProps {
    eventId: string;
    guests: any[];
}

export function SendInvitationsDialog({ eventId, guests }: SendInvitationsDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
    const [res, setRes] = useState<any>(null);

    const [sendMode, setSendMode] = useState<'pending' | 'all'>('pending');

    // Filter guests who have emails
    const validGuests = guests.filter(g => g.email);
    const pendingGuests = validGuests.filter(g => !g.invitation_sent_at);

    // Determine target based on mode
    const targetGuests = sendMode === 'pending' ? pendingGuests : validGuests;

    const handleSend = async () => {
        setIsLoading(true);

        const targetIds = targetGuests.map(g => g.id);

        if (targetIds.length === 0) {
            toast.error('No hay invitados destinatarios seleccionados.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await sendBulkInvitations(eventId, targetIds);
            setRes(res); // Store full response
            if (res.success) {
                setResult({ sent: res.sent || 0, failed: res.failed || 0 });
                if (res.sent && res.sent > 0) toast.success(`Enviados: ${res.sent}`);
            } else {
                toast.error(res.error || 'Error desconocido');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al intentar enviar.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        setOpen(false);
        setResult(null);
        setRes(null);
        setSendMode('pending');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
                    <Mail className="w-4 h-4" />
                    Enviar Invitaciones
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar Invitaciones por Email</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Selecciona a quién deseas enviar la invitación.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="py-4 space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className={`p-4 rounded-lg border cursor-pointer transition-all ${sendMode === 'pending' ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`} onClick={() => setSendMode('pending')}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-white">Solo Pendientes</span>
                                    <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-white">{pendingGuests.length}</span>
                                </div>
                                <p className="text-xs text-slate-400">Enviar solo a quienes nunca recibieron el correo.</p>
                            </div>

                            <div className={`p-4 rounded-lg border cursor-pointer transition-all ${sendMode === 'all' ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`} onClick={() => setSendMode('all')}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-white">Todos (Reenviar)</span>
                                    <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-white">{validGuests.length}</span>
                                </div>
                                <p className="text-xs text-slate-400">Enviar a todos los invitados con email, incluso si ya recibieron uno.</p>
                            </div>
                        </div>

                        {targetGuests.length === 0 && (
                            <div className="flex items-center gap-2 p-3 text-sm text-yellow-200 bg-yellow-900/20 border border-yellow-900/50 rounded-md">
                                <AlertCircle className="w-4 h-4" />
                                No hay destinatarios para la opción seleccionada.
                            </div>
                        )}

                        <div className="text-xs text-slate-500 text-center">
                            * Solo se procesarán invitados con dirección de email cargada.
                        </div>
                    </div>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.sent > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {result.sent > 0 ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
                        </div>
                        <div className="w-full">
                            <h3 className="text-lg font-bold text-white">¡Proceso Finalizado!</h3>
                            <p className="text-slate-400 mt-1">
                                Se enviaron {result.sent} correos correctamente.
                                {result.failed > 0 && <span className="text-red-400 block font-medium">Fallaron {result.failed}.</span>}
                            </p>

                            {result.failed > 0 && (res as any)?.failures && (
                                <div className="mt-4 text-left border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-black/20">
                                    {(res as any).failures.map((f: any, i: number) => (
                                        <div key={i} className="p-2 text-[10px] border-b border-white/5 last:border-0">
                                            <span className="text-white block truncate">{f.email}</span>
                                            <span className="text-red-400 block">{f.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || targetGuests.length === 0}
                                className="bg-violet-600 hover:bg-violet-500"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Enviar a {targetGuests.length}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={resetState} className="w-full bg-slate-800 hover:bg-slate-700">
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
