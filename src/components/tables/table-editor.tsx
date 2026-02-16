'use client';

import { useState } from 'react';
import { Table, upsertTable, deleteTable, assignGuestToTable } from '@/app/actions/tables';
import { Guest } from '@/lib/types';
import { TablesCanvas } from '@/components/tables/tables-canvas';
import { GuestSidebar } from '@/components/tables/guest-sidebar';
import { TableProperties } from '@/components/tables/table-properties';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TableEditorProps {
    eventId: string;
    initialTables: Table[];
    initialGuests: Guest[];
}

export function TableEditor({ eventId, initialTables, initialGuests }: TableEditorProps) {
    const [tables, setTables] = useState<Table[]>(initialTables);
    const [guests, setGuests] = useState<Guest[]>(initialGuests);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddTable = async () => {
        setIsSaving(true);
        const newTable: Partial<Table> = {
            event_id: eventId,
            name: `Mesa ${tables.length + 1}`,
            seats: 8,
            shape: 'round',
            x: 100,
            y: 100,
            rotation: 0
        };

        const res = await upsertTable(newTable);
        setIsSaving(false);

        if (res.success && res.data) {
            setTables(prev => [...prev, res.data!]);
            setSelectedTableId(res.data!.id);
            toast.success('Mesa creada');
        } else {
            toast.error('Error al crear mesa');
        }
    };

    const handleUpdateTable = async (tableId: string, updates: Partial<Table>) => {
        // Optimistic update
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
        setIsSaving(true);

        // Debounce handling could be improved here, but for now we save directly on blur/drag end
        const res = await upsertTable({ id: tableId, event_id: eventId, ...updates });
        setIsSaving(false);

        if (res.success && res.data) {
            // Update with definitive server data (preserves fields like x/y if backend logic changed them, 
            // but critically ensures we have latest version). 
            // We merge with existing checks to ensure we don't lose guests if the server response doesn't include them fully populated?
            // upsertTable returns mappedData which has basic fields. Guests are relation.
            // We should be careful not to wipe out guests if 'res.data' doesn't include them.
            // Looking at upsertTable, it returns mappedData. It does NOT include guests array!
            // So we must manually preserve guests from current state.

            setTables(prev => prev.map(t => {
                if (t.id === tableId) {
                    return { ...res.data, guests: t.guests };
                }
                return t;
            }));
        } else {
            toast.error('Error al guardar cambios');
            // Revert optimistic update? logic could be complex, for now just toast.
        }
    };

    const handleDeleteTable = async (tableId: string) => {
        if (confirm('¿Eliminar mesa? Los invitados volverán a estar pendientes.')) {
            setIsSaving(true);
            const res = await deleteTable(tableId);
            setIsSaving(false);

            if (res.success) {
                setTables(prev => prev.filter(t => t.id !== tableId));
                setSelectedTableId(null);

                // Unassign guests locally
                setGuests(prev => prev.map(g => g.table_id === tableId ? { ...g, table_id: null } : g));

                toast.success('Mesa eliminada');
            }
        }
    };

    const handleAssignGuest = async (guestId: string, tableId: string) => {
        // We find table from current closure to validate seats.
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        const currentGuests = guests.filter(g => g.table_id === tableId);
        if (currentGuests.length >= table.seats) {
            toast.error('Mesa llena');
            return;
        }

        setIsSaving(true);
        // Backend update
        const res = await assignGuestToTable(guestId, tableId);
        setIsSaving(false);

        if (res.success) {
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: tableId } : g));

            // Update table guests list locally for reactivity (need guest object)
            // We use 'guests' from closure to find the guest detail.
            const guest = guests.find(g => g.id === guestId);

            setTables(prev => prev.map(t => {
                if (t.id === tableId) {
                    return {
                        ...t,
                        guests: [...(t.guests || []), guest!]
                    };
                }
                return t;
            }));

            toast.success('Invitado asignado');
        } else {
            toast.error('Error al asignar invitado');
        }
    };

    const handleUnassignGuest = async (guestId: string) => {
        setIsSaving(true);
        const res = await assignGuestToTable(guestId, null);
        setIsSaving(false);

        if (res.success) {
            // Need to know which table it was to update tables state
            const guest = guests.find(g => g.id === guestId);
            const targetTableId = guest?.table_id;

            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: null } : g));

            if (targetTableId) {
                setTables(prev => prev.map(t => {
                    if (t.id === targetTableId) {
                        return {
                            ...t,
                            guests: t.guests?.filter(g => g.id !== guestId)
                        };
                    }
                    return t;
                }));
            }

            toast.success('Invitado removido de la mesa');
        }
    };

    const selectedTable = tables.find(t => t.id === selectedTableId) || null;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 relative">
            {/* Status Indicator */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {isSaving && (
                    <div className="bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center">
                        <span className="w-2 h-2 bg-black rounded-full mr-2 animate-bounce"></span>
                        GUARDANDO...
                    </div>
                )}
            </div>

            <div className="w-64 flex-shrink-0">
                <GuestSidebar guests={guests} onDragStart={(id) => { /* Handle drag start logic */ }} />
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Plano del Evento
                        {/* {isSaving && <span className="text-xs font-normal text-yellow-400">(Guardando...)</span>} */}
                    </h2>
                    <Button onClick={handleAddTable} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Mesa
                    </Button>
                </div>

                <TablesCanvas
                    tables={tables}
                    onTableSelect={setSelectedTableId}
                    onTableUpdate={(u) => handleUpdateTable(u.id!, u)}
                    onAssignGuest={handleAssignGuest}
                />
            </div>

            <div className="w-80 flex-shrink-0">
                <TableProperties
                    table={selectedTable}
                    onUpdate={(id, updates) => handleUpdateTable(id, updates)}
                    onDelete={handleDeleteTable}
                    onUnassignGuest={handleUnassignGuest}
                />
            </div>
        </div>
    );
}
