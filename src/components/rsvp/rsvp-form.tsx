'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Loader2, MapPin, Sparkles, CheckCircle2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { submitRSVP } from '@/app/actions/rsvp';

interface RSVPProps {
    guest: any; // We'll type this properly later or infer from Server Action
    token: string;
}

export function RSVPForm({ guest, token }: RSVPProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);

    // Determine existing data if they already RSVP'd
    const initialStatus = guest.rsvp_status === 'confirmed' || guest.rsvp_status === 'pending' ? 'confirmed' : 'declined';

    const [formData, setFormData] = useState({
        status: guest.rsvp_status === 'pending' ? 'confirmed' : guest.rsvp_status,
        dietary_restrictions: guest.dietary_restrictions?.notes || '',
        confirmed_companions: guest.plus_ones_confirmed || 0,
        companion_names: (guest.plus_ones_names || []).join(', '),
        notes: guest.notes || '',
    });

    const hasPlusOnes = guest.plus_ones_allowed > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await submitRSVP(token, formData);
            if (result.success) {
                toast.success('¡Gracias! Tu respuesta ha sido enviada.');
                setIsDone(true);
            } else {
                toast.error('Hubo un error al enviar tu respuesta.');
            }
        } catch {
            toast.error('Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isDone) {
        return (
            <Card className="w-full max-w-lg bg-slate-900/90 border-violet-500/30 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-500">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">¡Respuesta Enviada!</h2>
                    <p className="text-slate-300 max-w-xs">
                        {formData.status === 'confirmed'
                            ? 'Nos alegra mucho que puedas acompañarnos. Te esperamos.'
                            : 'Lamentamos que no puedas venir, te extrañaremos.'}
                    </p>
                    <div className="pt-4">
                        <Button variant="outline" onClick={() => window.location.reload()} className="border-white/10 text-slate-300">
                            Modificar respuesta
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg bg-slate-900/90 border-white/10 shadow-2xl backdrop-blur-md">
            <CardHeader className="text-center space-y-4 pb-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold text-white">{guest.event.name}</CardTitle>
                    <CardDescription className="text-slate-400 text-base mt-1">
                        Hola {guest.full_name}, por favor confirma tu asistencia.
                    </CardDescription>
                </div>

                <div className="flex flex-col gap-2 pt-2 text-sm text-slate-300 bg-white/5 py-3 rounded-lg border border-white/5">
                    {guest.event.date && (
                        <div className="flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <span>{new Date(guest.event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    )}
                    {guest.event.location_name && (
                        <div className="flex items-center justify-center gap-2">
                            <MapPin className="w-4 h-4 text-violet-400" />
                            <span>{guest.event.location_name}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-4">
                    {/* Attendance Status */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium text-white">¿Podrás asistir?</Label>
                        <RadioGroup
                            defaultValue={formData.status}
                            onValueChange={(val) => setFormData(d => ({ ...d, status: val }))}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="confirmed" id="confirmed" className="peer sr-only" />
                                <Label
                                    htmlFor="confirmed"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:text-white peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/10 peer-data-[state=checked]:text-green-400 cursor-pointer transition-all"
                                >
                                    <CheckCircle2 className="mb-2 h-6 w-6" />
                                    Sí, asistiré
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="declined" id="declined" className="peer sr-only" />
                                <Label
                                    htmlFor="declined"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:text-white peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/10 peer-data-[state=checked]:text-red-400 cursor-pointer transition-all"
                                >
                                    <Ticket className="mb-2 h-6 w-6 rotate-45" />
                                    No podré ir
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {formData.status === 'confirmed' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {/* Companions */}
                            {hasPlusOnes && (
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-white">Acompañantes ({guest.plus_ones_allowed} máx)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={guest.plus_ones_allowed}
                                            name="confirmed_companions"
                                            value={formData.confirmed_companions}
                                            onChange={(e) => setFormData(prev => ({ ...prev, confirmed_companions: parseInt(e.target.value) || 0 }))}
                                            className="w-20 bg-slate-900 border-slate-700 text-center"
                                        />
                                    </div>

                                    {formData.confirmed_companions > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="companion_names" className="text-xs text-slate-400">Nombres (separados por coma)</Label>
                                            <Input
                                                id="companion_names"
                                                name="companion_names"
                                                placeholder="Maria, Pedro..."
                                                value={formData.companion_names}
                                                onChange={handleChange}
                                                className="bg-slate-900 border-slate-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dietary Restrictions */}
                            <div className="space-y-2">
                                <Label htmlFor="dietary_restrictions" className="text-white">Restricciones Alimentarias</Label>
                                <Textarea
                                    id="dietary_restrictions"
                                    name="dietary_restrictions"
                                    placeholder="Vegetariano, celíaco, alergias..."
                                    value={formData.dietary_restrictions}
                                    onChange={handleChange}
                                    className="bg-white/5 border-white/10 min-h-[80px]"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-white">Mensaje para los novios (Opcional)</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="¡Qué emoción!..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="bg-white/5 border-white/10 min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-2 pb-6">
                    <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-500 text-lg py-6"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        Confirmar Respuesta
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

