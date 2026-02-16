'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { fabric } from 'fabric';

interface FabricViewerProps {
    design: any;
}

const FabricViewer = ({ design }: FabricViewerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        // Initialize Canvas in read-only mode
        // For read-only, we disable selection and interactivity.
        const initCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            selection: false, // Disable selection
            interactive: false // Disable interactivity? Fabric static canvas is an option
        });

        // Better yet: Use StaticCanvas for read-only
        // const initCanvas = new fabric.StaticCanvas(...);
        // But StaticCanvas doesn't support interactive objects if needed (e.g. click links).
        // For now, regular Canvas with disabled controls is safer for rendering JSON.

        fabricCanvasRef.current = initCanvas;

        if (design && Object.keys(design).length > 0) {
            initCanvas.loadFromJSON(design, () => {
                // Disable interactivity for all loaded objects
                initCanvas.getObjects().forEach((obj) => {
                    obj.selectable = false;
                    obj.evented = false; // No mouse events
                });
                initCanvas.renderAll();

                // Adjust zoom to fit container if possible?
                // For MVP, fixed size or simple CSS scaling.
            });
        }

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, [design]);

    return (
        <div className="w-full h-full flex items-center justify-center overflow-auto bg-slate-950/50 rounded-xl border border-white/10 p-4">
            <div className="relative shadow-2xl bg-white origin-top-left transform scale-50 md:scale-75 lg:scale-100 transition-transform">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default FabricViewer;
