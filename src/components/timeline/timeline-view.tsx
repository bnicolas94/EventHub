'use client';

import { TimelineItem } from '@/types/timeline.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MapPin, Wine, Cake, Disc, Music, Camera, Utensils, PartyPopper } from 'lucide-react';

interface TimelineViewProps {
    items: TimelineItem[];
}

const icons: Record<string, any> = {
    clock: Clock,
    map_pin: MapPin,
    wine: Wine,
    cake: Cake,
    disc: Disc,
    music: Music,
    camera: Camera,
    utensils: Utensils,
    party: PartyPopper
};

export function TimelineView({ items }: TimelineViewProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="py-12 px-4">
            <h2 className="text-3xl font-serif text-center mb-12 text-primary font-bold">Cronograma</h2>
            <div className="relative max-w-3xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-ml-px"></div>

                <div className="space-y-12">
                    {items.map((item, index) => {
                        const Icon = icons[item.icon] || Clock;
                        const date = new Date(item.start_time);
                        const isEven = index % 2 === 0;

                        return (
                            <div key={item.id} className="relative flex items-start md:items-center justify-between group">
                                {/* Icon/Dot */}
                                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary z-10 shadow-sm group-hover:scale-110 transition-transform duration-200">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>

                                {/* Content Container */}
                                <div className={`flex flex-col md:flex-row w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                    {/* Spacer for desktop alignment */}
                                    <div className="hidden md:block w-1/2" />

                                    {/* Content Card */}
                                    <div className={`pl-16 md:pl-0 md:w-1/2 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                                        <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                            <span className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-bold mb-2">
                                                {format(date, 'HH:mm', { locale: es })}
                                            </span>
                                            <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                                            {item.description && (
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
