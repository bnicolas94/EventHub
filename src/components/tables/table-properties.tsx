'use client';

import { Table } from '@/app/actions/tables';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, UserMinus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface TablePropertiesProps {
    table: Table | null;
    onUpdate: (tableId: string, updates: Partial<Table>) => void;
    onDelete: (tableId: string) => void;
    onUnassignGuest: (guestId: string) => void;
}

export function TableProperties({ table, onUpdate, onDelete, onUnassignGuest }: TablePropertiesProps) {
    const [name, setName] = useState('');
    const [seats, setSeats] = useState(8);
    const [shape, setShape] = useState<'round' | 'rectangular' | 'square'>('round');
    // Track if user is actively editing to avoid loops or premature saves
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (table && !isEditing) {
            setName(table.name);
            setSeats(table.seats);
            setShape(table.shape);
        }
    }, [table, isEditing]);

    // Manual Save on Blur/Action
    const handleSave = () => {
        if (!table) return;
        onUpdate(table.id, { name, seats });
        setIsEditing(false);
    };

    if (!table) {
        return (
            <Card className="h-full bg-slate-900 border-white/10 flex flex-col items-center justify-center text-center p-6">
                <p className="text-slate-500 text-sm">Selecciona una mesa para editar sus propiedades.</p>
            </Card>
        );
    }

    // Immediate save for shape (select)
    const handleShapeChange = (v: any) => {
        setShape(v);
        onUpdate(table.id, { shape: v });
    };

    return (
        <Card className="h-full bg-slate-900 border-white/10 flex flex-col">
            <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-white text-sm font-medium">Propiedades de Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Nombre</Label>
                    <Input
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setIsEditing(true);
                        }}
                        onBlur={handleSave}
                        className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Forma</Label>
                    <Select
                        value={shape}
                        onValueChange={handleShapeChange}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="round">Redonda</SelectItem>
                            <SelectItem value="rectangular">Rectangular</SelectItem>
                            <SelectItem value="square">Cuadrada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Asientos</Label>
                    <Input
                        type="number"
                        value={seats}
                        onChange={(e) => {
                            setSeats(Number(e.target.value));
                            setIsEditing(true);
                        }}
                        onBlur={handleSave}
                        className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                    />
                </div>

                <div className="pt-4 border-t border-white/5">
                    <Label className="text-xs text-slate-400 block mb-2">
                        Invitados ({table.guests?.length || 0} / {seats})
                    </Label>
                    <div className="space-y-1">
                        {table.guests?.map((guest: any) => (
                            <div key={guest.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 text-xs">
                                <span className="text-slate-300 truncate max-w-[120px]">{guest.full_name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-red-500/20 hover:text-red-400 text-slate-500"
                                    onClick={() => onUnassignGuest(guest.id)}
                                >
                                    <UserMinus className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        {(!table.guests || table.guests.length === 0) && (
                            <p className="text-xs text-slate-600 italic">Mesa vacía</p>
                        )}
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 border border-red-900/50"
                        onClick={() => onDelete(table.id)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Mesa
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
