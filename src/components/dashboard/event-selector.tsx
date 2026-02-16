'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Event {
    id: string;
    name: string;
}

interface EventSelectorProps {
    events: { id: string; name: string }[];
    activeEventId: string;
    setActiveEventAction: (eventId: string) => Promise<{ success: boolean }>;
}

export function EventSelector({ events, activeEventId, setActiveEventAction }: EventSelectorProps) {

    const router = useRouter();

    const handleValueChange = async (value: string) => {
        try {
            await setActiveEventAction(value);
            toast.success('Evento cambiado');
            router.refresh(); // Refresh server components
        } catch (error) {
            toast.error('Error al cambiar de evento');
        }
    };

    // If no events, disable or show placeholder
    if (!events || events.length === 0) {
        return (
            <div className="text-slate-400 text-sm italic">
                Sin eventos
            </div>
        );
    }

    return (
        <Select
            value={activeEventId}
            onValueChange={handleValueChange}
        >

            <SelectTrigger className="w-[200px] h-9 bg-white/5 border-white/10 text-white focus:ring-violet-500">
                <SelectValue placeholder="Seleccionar evento" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
                {events.map((event) => (
                    <SelectItem
                        key={event.id}
                        value={event.id}
                        className="cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                        {event.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
