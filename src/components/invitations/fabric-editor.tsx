'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Type,
    Image as ImageIcon,
    Trash2,
    Download,
    Save,
    Square,
    Circle as CircleIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// Fabric.js 5.3.0 compatible import
import { fabric } from 'fabric';

interface FabricEditorProps {
    initialDesign?: any;
    onSave?: (design: any) => void;
}

const FabricEditor = ({ initialDesign, onSave }: FabricEditorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Use useRef to store fabric.Canvas instance to avoid closure staleness and re-renders
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        console.log('Initializing Fabric Canvas');
        const initCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            selection: true
        });

        fabricCanvasRef.current = initCanvas;

        // Load initial design if available and valid
        if (initialDesign && Object.keys(initialDesign).length > 0) {
            console.log('Loading initial design...');
            try {
                initCanvas.loadFromJSON(initialDesign, () => {
                    initCanvas.renderAll();
                    console.log('Initial design loaded');
                    setIsLoaded(true);
                });
            } catch (err) {
                console.error('Error loading design JSON:', err);
                setIsLoaded(true);
            }
        } else {
            setIsLoaded(true);
        }

        // Event Listeners
        initCanvas.on('selection:created', (e: any) => setSelectedObject(e.selected[0]));
        initCanvas.on('selection:updated', (e: any) => setSelectedObject(e.selected[0]));
        initCanvas.on('selection:cleared', () => setSelectedObject(null));

        return () => {
            // Cleanup: verify canvas exists before disposal
            if (fabricCanvasRef.current) {
                console.log('Disposing Fabric Canvas');
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures run once

    // Tools
    const addText = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const text = new fabric.IText('Texto Doble Clic', {
            left: 100,
            top: 100,
            fontFamily: 'Arial',
            fill: '#333333',
            fontSize: 24
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    const addRect = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const rect = new fabric.Rect({
            left: 150,
            top: 150,
            fill: '#ff5722',
            width: 100,
            height: 100
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
    };

    const addCircle = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const circle = new fabric.Circle({
            left: 200,
            top: 200,
            fill: '#2196f3',
            radius: 50
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
    };

    const deleteSelected = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject) return;
        canvas.remove(selectedObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObject(null);
    };

    const handleSave = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const json = canvas.toJSON();
        console.log('Design JSON:', json);
        if (onSave) onSave(json);
        // Toast is handled by parent, but we can show one here too or remove duplicate
    };

    const handleDownload = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
        const link = document.createElement('a');
        link.download = 'invitacion.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const changeColor = (color: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject) return;
        selectedObject.set('fill', color);
        canvas.renderAll();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target?.result;
            const canvas = fabricCanvasRef.current;
            if (!data || !canvas) return;

            fabric.Image.fromURL(data.toString(), (img) => {
                img.scaleToWidth(200);
                canvas.add(img);
                canvas.centerObject(img);
                canvas.setActiveObject(img);
            });
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Hidden Input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Toolbar */}
            <Card className="w-full md:w-64 bg-slate-900 border-white/10 p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Elementos</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={addText} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                            <Type className="w-4 h-4 mr-2" /> Texto
                        </Button>
                        <Button variant="outline" onClick={addRect} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                            <Square className="w-4 h-4 mr-2" /> Rect
                        </Button>
                        <Button variant="outline" onClick={addCircle} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                            <CircleIcon className="w-4 h-4 mr-2" /> Circulo
                        </Button>
                        <Button variant="outline" onClick={triggerImageUpload} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                            <ImageIcon className="w-4 h-4 mr-2" /> Imagen
                        </Button>
                    </div>
                </div>

                {selectedObject && (
                    <div className="space-y-4 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-medium text-slate-300">Propiedades</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'].map(color => (
                                    <button
                                        key={color}
                                        className="w-6 h-6 rounded-full border border-white/20"
                                        style={{ backgroundColor: color }}
                                        onClick={() => changeColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelected}
                            className="w-full"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </Button>
                    </div>
                )}

                <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
                    <Button onClick={handleSave} className="w-full bg-violet-600 hover:bg-violet-500">
                        <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                    <Button variant="ghost" onClick={handleDownload} className="w-full text-slate-400 hover:text-white">
                        <Download className="w-4 h-4 mr-2" /> Descargar PNG
                    </Button>
                </div>
            </Card>

            {/* Canvas Area */}
            <div className="flex-1 bg-slate-950/50 rounded-xl border border-white/10 flex items-center justify-center p-8 overflow-auto">
                <div className="relative shadow-2xl">
                    <canvas ref={canvasRef} />
                    {!isLoaded && <div className="absolute inset-0 bg-white/50 animate-pulse" />}
                </div>
            </div>
        </div>
    );
};

export default FabricEditor;
