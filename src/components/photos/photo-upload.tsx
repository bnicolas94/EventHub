'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { uploadPhoto } from '@/app/actions/photos'; // We'll update actions to accept FormData
import Image from 'next/image';

interface PhotoUploadProps {
    eventId: string;
    guestId?: string; // Optional if anon
}

// Bulk upload version
export function PhotoUpload({ eventId, guestId }: PhotoUploadProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100 or count
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // Limit to e.g. 10 files at once for MVP sanity
            if (selectedFiles.length > 10) {
                toast.error('Máximo 10 fotos a la vez');
                return;
            }

            const newFiles: File[] = [];
            const newPreviews: string[] = [];

            try {
                // Compress all
                await Promise.all(selectedFiles.map(async (file) => {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true
                    };
                    const compressedFile = await imageCompression(file, options);
                    newFiles.push(compressedFile);
                    newPreviews.push(URL.createObjectURL(compressedFile));
                }));

                setFiles(prev => [...prev, ...newFiles]);
                setPreviews(prev => [...prev, ...newPreviews]);
            } catch (error) {
                console.error('Compression error:', error);
                toast.error('Error al procesar algunas imágenes');
            }
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        let successCount = 0;
        let errors = 0;

        // Process sequentially to show progress and not kill the server
        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            formData.append('eventId', eventId);
            if (guestId) formData.append('guestId', guestId);
            // Caption is tricky for bulk, let's omit or use same. MVP: omit.

            const res = await uploadPhoto(formData);

            if (res.success) {
                successCount++;
            } else {
                errors++;
                console.error('Upload failed for file', i, res.error);
            }

            setUploadProgress(i + 1);
        }

        setIsUploading(false);

        if (successCount > 0) {
            toast.success(`Se subieron ${successCount} fotos.`);
            if (errors > 0) toast.warning(`Fallaron ${errors} fotos.`);

            setIsOpen(false);
            setFiles([]);
            setPreviews([]);
            setUploadProgress(0);
        } else {
            toast.error('Error al subir las fotos. Intenta de nuevo.');
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearSelection = () => {
        setFiles([]);
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-2 border-white/20 z-50 animate-in zoom-in duration-300"
                    size="icon"
                >
                    <Camera className="h-6 w-6 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur border-slate-800 text-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Subir Fotos ({files.length})</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {files.length === 0 ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors gap-3"
                        >
                            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">Toca para seleccionar fotos</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                multiple // Enable multiple selection
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-black/50 border border-slate-700">
                                        <Image
                                            src={src}
                                            alt={`Preview ${index}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-800/50"
                                >
                                    <span className="text-2xl text-slate-500">+</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                                    Limpiar todo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Hidden input needs to stay rendered to allow adding more */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />

                    <Button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {uploadProgress > 0 ? `Subiendo ${uploadProgress}/${files.length}...` : 'Procesando...'}
                            </>
                        ) : (
                            `Publicar ${files.length > 0 ? files.length : ''} Foto${files.length !== 1 ? 's' : ''}`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
