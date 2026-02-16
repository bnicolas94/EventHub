'use client';

import { useState, useEffect } from 'react';
import { TimelineItem } from '@/types/timeline.types';
import { TimelineItemForm } from '@/components/timeline/timeline-item-form';
import { Button } from '@/components/ui/button';
import { deleteTimelineItem, reorderTimelineItems } from '@/app/actions/timeline';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { MoreVertical, GripVertical, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

function SortableItem({ item, onEdit, onDelete }: { item: TimelineItem; onEdit: (item: TimelineItem) => void; onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 flex items-center gap-4 mb-2 shadow-sm touch-none">
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0">
                        {format(new Date(item.start_time), 'HH:mm')}
                    </span>
                    <h3 className="font-medium truncate">{item.title}</h3>
                </div>
                {item.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-full">{item.description}</p>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600 focus:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function TimelineManager({ eventId, initialItems }: { eventId: string; initialItems: TimelineItem[] }) {
    const [items, setItems] = useState<TimelineItem[]>(initialItems);
    const [editingItem, setEditingItem] = useState<TimelineItem | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Sync props to state when server revalidates
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Optimistic update
                const reorderPayload = newItems.map((item, index) => ({
                    id: item.id,
                    order: index
                }));

                reorderTimelineItems(eventId, reorderPayload).catch(() => {
                    toast.error('Error al guardar el orden');
                    // We rely on revalidation to fix order if error occurs or revert logic here
                });

                return newItems;
            });
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este item?')) return;

        // Optimistic delete
        setItems(prev => prev.filter(i => i.id !== id));

        try {
            const res = await deleteTimelineItem(id, eventId);
            if (!res.success) {
                toast.error(res.error);
                // Revert handled by revalidation via useEffect if props update, otherwise tricky without full reload
            } else {
                toast.success('Item eliminado');
            }
        } catch (err) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">Cronograma del Evento</h2>
                    <p className="text-sm text-muted-foreground">
                        Organiza el itinerario arrastrando los elementos.
                    </p>
                </div>
                <Button onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }}>
                    Agregar Item
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {items.length === 0 && (
                <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-card/50">
                    <h3 className="text-lg font-medium mb-1">Tu cronograma está vacío</h3>
                    <p className="text-muted-foreground text-sm mb-4">Comienza agregando el primer evento de la agenda.</p>
                    <Button variant="outline" onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }}>
                        Agregar Item
                    </Button>
                </div>
            )}

            <TimelineItemForm
                eventId={eventId}
                item={editingItem}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={() => {
                    // Server action handles revalidation, useEffect updates state
                }}
            />
        </div>
    );
}
