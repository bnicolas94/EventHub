'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ChecklistItem, toggleChecklistItem } from '@/app/actions/checklist';
import { useState } from 'react';
import { toast } from 'sonner';

interface SmartChecklistProps {
    items: ChecklistItem[];
    progress: number;
}

export function SmartChecklist({ items, progress }: SmartChecklistProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggle = async (item: ChecklistItem) => {
        setLoadingId(item.id);
        try {
            const result = await toggleChecklistItem(item.id, !item.is_completed);
            if (result.success) {
                toast.success(item.is_completed ? 'Tarea pendiente' : 'Tarea completada');
            } else {
                toast.error('Error al actualizar la tarea');
            }
        } catch (error) {
            toast.error('Error de red');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Card className="bg-slate-900/50 border-white/10 h-full backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                    <span>Lista de Tareas</span>
                    <span className="text-sm font-normal text-slate-400">{Math.round(progress)}% completado</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Progress value={progress} className="h-2" />
                </div>
                <div className="space-y-4">
                    {items.map((task) => (
                        <div
                            key={task.id}
                            className={`flex items-start gap-3 group transition-opacity ${loadingId === task.id ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                            onClick={() => handleToggle(task)}
                        >
                            <div className="mt-0.5 text-slate-500 group-hover:text-violet-400 transition-colors">
                                {loadingId === task.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                                ) : task.is_completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>
                            <span className={`text-sm ${task.is_completed ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>
                                {task.title}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

