'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Heart, Share2, Download } from 'lucide-react';
import { deletePhoto } from '@/app/actions/photos';
import { toast } from 'sonner';

interface Photo {
    id: string;
    url: string;
    caption?: string;
    guest_id?: string;
    status: 'approved' | 'pending' | 'rejected';
}

interface PhotoGalleryProps {
    photos: Photo[];
    isOwner?: boolean;
}

export function PhotoGallery({ photos: initialPhotos, isOwner = false }: PhotoGalleryProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    const handleDelete = async (photoId: string, url: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta foto?')) return;

        const res = await deletePhoto(photoId, url);
        if (res.success) {
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            setSelectedPhoto(null);
            toast.success('Foto eliminada');
        } else {
            toast.error('Error al eliminar');
        }
    };

    if (photos.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                <p className="text-slate-400">Aún no hay fotos. ¡Sé el primero en subir una! 📸</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="relative group aspect-square overflow-hidden rounded-xl bg-slate-800 cursor-pointer break-inside-avoid"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <Image
                            src={photo.url}
                            alt={photo.caption || 'Foto del evento'}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium text-sm">Ver Foto</span>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="max-w-4xl bg-black/95 border-slate-800 p-0 overflow-hidden h-[80vh] flex flex-col md:flex-row">
                    <div className="relative flex-1 bg-black flex items-center justify-center">
                        {selectedPhoto && (
                            <div className="relative w-full h-full">
                                <Image
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.caption || 'Detalle'}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-80 bg-slate-900 p-6 flex flex-col gap-4 border-l border-slate-800">
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">Detalles</h3>
                            <p className="text-slate-400 text-sm italic">
                                "{selectedPhoto?.caption || 'Sin descripción'}"
                            </p>
                            {/* Metadata could go here: uploaded by, time, etc. */}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                                <Heart className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-800">
                                <a href={selectedPhoto?.url} download target="_blank" rel="noopener noreferrer">
                                    <Download className="w-5 h-5" />
                                </a>
                            </Button>

                            {isOwner && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => selectedPhoto && handleDelete(selectedPhoto.id, selectedPhoto.url)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
