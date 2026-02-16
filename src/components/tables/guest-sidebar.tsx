'use client';

import { Guest } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GuestSidebarProps {
    guests: Guest[];
    onDragStart: (guestId: string) => void;
}

export function GuestSidebar({ guests, onDragStart }: GuestSidebarProps) {
    const [search, setSearch] = useState('');

    const unseatedGuests = guests.filter(g => !g.table_id && g.rsvp_status === 'confirmed');

    const filteredGuests = unseatedGuests.filter(g =>
        g.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card className="h-full bg-slate-900 border-white/10 flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium flex justify-between items-center">
                    <span>Sin Asignar</span>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {unseatedGuests.length}
                    </Badge>
                </CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-slate-400" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-8 h-8 bg-slate-800 border-slate-700 text-xs text-white placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full px-4">
                    <div className="space-y-2 py-2">
                        {filteredGuests.map(guest => (
                            <div
                                key={guest.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('guestId', guest.id);
                                    onDragStart(guest.id);
                                }}
                                className="flex items-center gap-3 p-2 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-600 cursor-grab active:cursor-grabbing transition-all"
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-indigo-500/20 text-indigo-300">
                                        {guest.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">
                                        {guest.full_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {guest.group_name || 'General'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {filteredGuests.length === 0 && (
                            <p className="text-xs text-slate-500 text-center py-4">
                                No hay invitados pendientes.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
