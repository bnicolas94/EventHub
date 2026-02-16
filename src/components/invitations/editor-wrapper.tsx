'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveInvitation } from '@/app/actions/invitations';
import { toast } from 'sonner';

interface FabricEditorProps {
    initialDesign?: any;
    eventId?: string; // Optional if saving is handled differently, but here we pass it.
}

// Dynamically import FabricEditor
const FabricEditorBase = dynamic(
    () => import('@/components/invitations/fabric-editor'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[600px] w-full bg-slate-900 rounded-xl border border-white/10 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" /> Cargando Editor...
            </div>
        )
    }
);

// Wrapper Component to handle saving logic
export default function InvitationEditorWrapper({ initialDesign, eventId }: FabricEditorProps) {
    const handleSave = async (designJSON: any) => {
        if (!eventId) {
            toast.error('No se ha encontrado el ID del evento.');
            return;
        }

        const result = await saveInvitation(eventId, designJSON);
        if (result.success) {
            toast.success('Diseño guardado en la base de datos');
        } else {
            toast.error('Error al guardar: ' + result.error);
        }
    };

    return (
        <FabricEditorBase
            initialDesign={initialDesign}
            onSave={handleSave}
        // Passing eventId down purely if needed for other things (uploads), but main save is here.
        />
    );
}

// Since FabricEditor component expects onSave prop, we wrap it here so page.tsx can be clean.
