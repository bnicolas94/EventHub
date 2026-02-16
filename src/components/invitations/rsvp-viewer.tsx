'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const FabricViewerBase = dynamic(
    () => import('@/components/invitations/fabric-viewer'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[400px] w-full bg-slate-900 rounded-xl border border-white/10 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" /> Cargando Invitación...
            </div>
        )
    }
);

interface RSVPViewerProps {
    design: any;
}

export default function RSVPViewerWrapper({ design }: RSVPViewerProps) {
    if (!design || Object.keys(design).length === 0) {
        return (
            <div className="w-full text-center p-8 bg-slate-900/50 rounded-xl border border-white/10">
                <p className="text-slate-400">Invitación en proceso de diseño</p>
            </div>
        );
    }

    return (
        <div className="w-full mb-8 flex justify-center">
            {/* Wraps FabricViewerBase */}
            <div className="md:w-[800px] w-full aspect-[4/3] flex justify-center">
                {/* CSS scaling hack in fabric-viewer handles responsive, but wrapper constrains it */}
                <FabricViewerBase design={design} />
            </div>
        </div>
    );
}

// Actually, I need to check how FabricViewer handles props.
// FabricViewer default export.
