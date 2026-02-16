'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { createGuest, updateGuest } from '@/app/actions/guests';
import { Guest } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface GuestFormDialogProps {
    eventId: string;
    guestToEdit?: Guest;
    trigger?: React.ReactNode;
}

export function GuestFormDialog({ eventId, guestToEdit, trigger }: GuestFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // If editing, initialize state with guest data; otherwise empty
    // Assuming Guest has full_name, group_name, plus_ones_allowed
    const guestToEditAny = guestToEdit as any; // Temporary fix for type mismatch if needed

    const [formData, setFormData] = useState({
        first_name: guestToEditAny ? (guestToEditAny.first_name || guestToEditAny.full_name?.split(' ')[0] || '') : '',
        last_name: guestToEditAny ? (guestToEditAny.last_name || guestToEditAny.full_name?.split(' ').slice(1).join(' ') || '') : '',
        email: guestToEditAny?.email || '',
        phone: guestToEditAny?.phone || '',
        category: guestToEditAny?.group_name || 'General',
        companion_limit: guestToEditAny?.plus_ones_allowed || guestToEditAny?.companion_limit || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'companion_limit' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId) {
            toast.error('No se ha seleccionado un evento');
            return;
        }

        setIsLoading(true);

        try {
            if (guestToEdit) {
                // Update Logic
                const updates = {
                    full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                    email: formData.email,
                    phone: formData.phone,
                    group_name: formData.category,
                    plus_ones_allowed: formData.companion_limit,
                };
                const result = await updateGuest(guestToEdit.id, updates);
                if (result.success) {
                    toast.success('Invitado editado correctamente');
                    setOpen(false);
                    router.refresh();
                } else {
                    toast.error(result.error || 'Error al editar invitado');
                }
            } else {
                // Create Logic
                const result = await createGuest(formData, eventId);
                if (result.success) {
                    toast.success('Invitado añadido correctamente');
                    setOpen(false);
                    // Reset form
                    setFormData({ first_name: '', last_name: '', email: '', phone: '', category: 'General', companion_limit: 0 });
                    router.refresh();
                } else {
                    toast.error(result.error || 'Error al añadir invitado');
                }
            }
        } catch {
            toast.error('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const isEdit = !!guestToEdit;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="bg-violet-600 hover:bg-violet-500 gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Invitado
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Invitado' : 'Añadir Invitado'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modifica los datos del invitado.' : 'Ingresa los datos básicos para enviar la invitación luego.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Nombre</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                placeholder="Juan"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Apellido</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                placeholder="Pérez"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="juan@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+54 9 11..."
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => handleSelectChange('category', val)}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                    <SelectItem value="Familia">Familia</SelectItem>
                                    <SelectItem value="Amigos">Amigos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companion_limit">Acompañantes permitidos</Label>
                        <Input
                            id="companion_limit"
                            name="companion_limit"
                            type="number"
                            min="0"
                            max="10"
                            value={formData.companion_limit}
                            onChange={handleChange}
                            className="bg-white/5 border-white/10"
                        />
                        <p className="text-xs text-slate-500">0 significa solo el invitado.</p>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-500"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEdit ? 'Guardar Cambios' : 'Guardar Invitado'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
