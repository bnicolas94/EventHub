'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Table } from '@/app/actions/tables';

interface TablesCanvasProps {
    tables: Table[];
    onTableSelect: (tableId: string | null) => void;
    onTableUpdate: (table: Partial<Table>) => void;
    onAssignGuest: (guestId: string, tableId: string) => void;
}

export function TablesCanvas({ tables, onTableSelect, onTableUpdate, onAssignGuest }: TablesCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const guestId = e.dataTransfer.getData('guestId');
        if (!guestId || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(e.nativeEvent);
        const point = new fabric.Point(pointer.x, pointer.y);

        let targetTableId: string | null = null;

        canvas.getObjects().forEach((obj) => {
            if (obj.containsPoint(point)) {
                if (obj.data?.id) {
                    targetTableId = obj.data.id;
                }
            }
        });

        if (targetTableId) {
            onAssignGuest(guestId, targetTableId);
        }
    };

    const isRedrawing = useRef(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping

        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(e.nativeEvent);

        // Highlight table on drag over
        canvas.getObjects().forEach((obj) => {
            if (obj instanceof fabric.Group) {
                // Check if it's a table group
                const point = new fabric.Point(pointer.x, pointer.y);
                const isHovered = obj.containsPoint(point);
                const shape = obj.getObjects()[0]; // The shape is the first object in group

                if (isHovered) {
                    const seats = obj.data?.seats || 0;
                    const currentGuests = obj.data?.currentGuests || 0;
                    const isFull = currentGuests >= seats;

                    if (isFull) {
                        // Red highlight for full table
                        if (shape.stroke !== '#ef4444') { // red-500
                            shape.set({ stroke: '#ef4444', strokeWidth: 4 });
                            canvas.requestRenderAll();
                        }
                        e.dataTransfer.dropEffect = 'none'; // visual cursor feedback (might flicker)
                    } else {
                        // Indigo highlight for available table
                        if (shape.stroke !== '#6366f1') { // indigo-500
                            shape.set({ stroke: '#6366f1', strokeWidth: 4 });
                            canvas.requestRenderAll();
                        }
                        e.dataTransfer.dropEffect = 'copy';
                    }
                } else {
                    // Reset to default
                    if (shape.stroke === '#6366f1' || shape.stroke === '#ef4444') {
                        shape.set({ stroke: '#94a3b8', strokeWidth: 2 }); // reset to slate-400
                        canvas.requestRenderAll();
                    }
                }
            }
        });
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Reset all highlights
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;

        canvas.getObjects().forEach((obj) => {
            if (obj instanceof fabric.Group) {
                const shape = obj.getObjects()[0];
                if (shape.stroke === '#6366f1' || shape.stroke === '#ef4444') {
                    shape.set({ stroke: '#94a3b8', strokeWidth: 2 });
                }
            }
        });
        canvas.requestRenderAll();
    };

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 800,
            backgroundColor: '#1e293b', // slate-800
            selection: false
        });

        fabricCanvasRef.current = canvas;

        // Event Listeners
        canvas.on('object:modified', (e) => {
            const activeObject = e.target;
            if (activeObject && activeObject.data?.id) {
                onTableUpdate({
                    id: activeObject.data.id,
                    x: activeObject.left,
                    y: activeObject.top,
                    rotation: activeObject.angle,
                });
            }
        });

        canvas.on('selection:created', (e) => {
            if (e.selected && e.selected.length > 0) {
                onTableSelect(e.selected[0].data?.id);
            }
        });

        canvas.on('selection:cleared', () => {
            // Ignorar evento si estamos redibujando el canvas
            if (isRedrawing.current) return;
            onTableSelect(null);
        });

        return () => {
            canvas.dispose();
        };
    }, []);

    // Load Tables
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        isRedrawing.current = true;

        // Remember currently selected ID to restore it after redraw
        const activeObject = canvas.getActiveObject();
        const selectedId = activeObject?.data?.id;

        // Clear existing objects to avoid dupes on re-render
        canvas.clear();
        canvas.setBackgroundColor('#1e293b', canvas.renderAll.bind(canvas));

        tables.forEach(table => {
            let shape: fabric.Object;

            const commonProps = {
                left: table.x || 100,
                top: table.y || 100,
                fill: '#475569', // slate-600
                stroke: '#94a3b8', // slate-400
                strokeWidth: 2,
                angle: table.rotation || 0,
                originX: 'center',
                originY: 'center',
                hasControls: true,
                hasBorders: true,
                data: { id: table.id }
            };

            if (table.shape === 'round') {
                shape = new fabric.Circle({
                    radius: 40,
                    ...commonProps
                });
            } else {
                shape = new fabric.Rect({
                    width: 120,
                    height: 80,
                    rx: 4, // rounded corners
                    ry: 4,
                    ...commonProps
                });
            }

            const currentGuests = table.guests?.length || 0;
            const label = `${table.name} (${currentGuests}/${table.seats})`;

            const text = new fabric.Text(label, {
                fontSize: 14,
                fill: '#ffffff',
                originX: 'center',
                originY: 'center',
                left: commonProps.left,
                top: commonProps.top
            });

            const group = new fabric.Group([shape, text], {
                ...commonProps,
                subTargetCheck: true,
                // Store capacity info in data for easier access during drag
                data: {
                    id: table.id,
                    seats: table.seats,
                    currentGuests: currentGuests
                }
            });

            canvas.add(group);

            // Restore selection if this is the one
            if (selectedId && table.id === selectedId) {
                canvas.setActiveObject(group);
            }
        });

        canvas.requestRenderAll();

        // If we restored selection, ensure parent state knows (redundant but safe)
        // Actually, canvas.clear() triggered 'selection:cleared' which called onTableSelect(null).
        // Since we re-selected immediately, it triggered 'selection:created' calling onTableSelect(id).
        // This rapid null -> id might be why it flickers or closes.
        // Better: check if we should suppress the null update?
        // But for now, re-selecting immediately should bring the panel back if it unmounted.

        // Reset flag
        isRedrawing.current = false;
    }, [tables]);

    return (
        <div
            className="border border-white/10 rounded-xl overflow-hidden shadow-xl bg-slate-900"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <canvas ref={canvasRef} />
        </div>
    );
}
