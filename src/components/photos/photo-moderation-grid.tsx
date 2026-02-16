'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Trash2, Eye, AlertCircle, Download, Shield, Loader2 } from 'lucide-react';
import { deletePhoto, updatePhotoStatus } from '@/app/actions/photos';
import { updateEventSettings } from '@/app/actions/events';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Photo {
    id: string;
    url: string;
    caption?: string;
    status: 'approved' | 'pending' | 'rejected';
    created_at?: string;
    uploaded_at?: string;
}

interface PhotoModerationGridProps {
    initialPhotos: Photo[];
    eventId: string;
    initialModerationEnabled: boolean;
}

export function PhotoModerationGrid({ initialPhotos, eventId, initialModerationEnabled }: PhotoModerationGridProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const [filter, setFilter] = useState<string>('all');
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New States
    const [moderationEnabled, setModerationEnabled] = useState(initialModerationEnabled);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const filteredPhotos = photos.filter(photo => {
        if (filter === 'all') return true;
        return photo.status === filter;
    });

    const handleStatusUpdate = async (photoId: string, newStatus: 'approved' | 'rejected') => {
        const loadingToast = toast.loading('Actualizando estado...');
        const res = await updatePhotoStatus(photoId, newStatus);

        toast.dismiss(loadingToast);

        if (res.success) {
            setPhotos(prev => prev.map(p =>
                p.id === photoId ? { ...p, status: newStatus } : p
            ));
            toast.success(`Foto ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`);
            if (selectedPhoto?.id === photoId) {
                setSelectedPhoto(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } else {
            toast.error('Error al actualizar estado');
        }
    };

    const handleDelete = async (photoId: string, url: string) => {
        setIsDeleting(true);
        const res = await deletePhoto(photoId, url);
        setIsDeleting(false);

        if (res.success) {
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            setSelectedPhoto(null);
            toast.success('Foto eliminada permanentemente');
        } else {
            toast.error('Error al eliminar');
        }
    };

    const handleModerationToggle = async (checked: boolean) => {
        setModerationEnabled(checked); // Optimistic update
        const res = await updateEventSettings(eventId, { moderation_enabled: checked });

        if (res.success) {
            toast.success(`Moderación ${checked ? 'activada' : 'desactivada'}`);
        } else {
            setModerationEnabled(!checked); // Revert
            toast.error('Error al guardar configuración');
        }
    };

    const handleDownloadZip = async () => {
        if (photos.length === 0) {
            toast.error('No hay fotos para descargar');
            return;
        }

        setIsDownloading(true);
        setDownloadProgress(0);
        const zip = new JSZip();
        let processed = 0;
        const total = photos.length;

        try {
            toast.info('Iniciando descarga masiva...');

            const downloadPromises = photos.map(async (photo, index) => {
                try {
                    // Fetch image as blob
                    const response = await fetch(photo.url);
                    if (!response.ok) throw new Error('Network error');
                    const blob = await response.blob();

                    // Determine filename from MIME type (safer than URL)
                    let ext = 'jpg';
                    switch (blob.type) {
                        case 'image/jpeg': ext = 'jpg'; break;
                        case 'image/png': ext = 'png'; break;
                        case 'image/gif': ext = 'gif'; break;
                        case 'image/webp': ext = 'webp'; break;
                        case 'image/heic': ext = 'heic'; break;
                        case 'image/heif': ext = 'heif'; break;
                        default:
                            // Fallback to URL extension if blob type is generic
                            const parts = photo.url.split('/');
                            const lastPart = parts[parts.length - 1].split('?')[0];
                            if (lastPart.includes('.')) {
                                ext = lastPart.split('.').pop() || 'jpg';
                            }
                    }

                    const filename = `foto_${index + 1}_${photo.status}.${ext}`;

                    zip.file(filename, blob);
                } catch (err) {
                    console.error(`Failed to download ${photo.url}`, err);
                } finally {
                    processed++;
                    setDownloadProgress(Math.round((processed / total) * 100));
                }
            });

            await Promise.all(downloadPromises);

            toast.info('Generando archivo ZIP...');
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `eventhub_fotos_${eventId}.zip`);
            toast.success('Descarga completada');

        } catch (error) {
            console.error('ZIP generation error:', error);
            toast.error('Error al generar el archivo ZIP');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Aprobada</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Rechazada</Badge>;
            default:
                return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pendiente</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <Tabs defaultValue="all" onValueChange={setFilter} className="w-full xl:w-auto order-2 xl:order-1">
                    <TabsList className="grid w-full grid-cols-4 xl:w-[400px]">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="approved">Aprobadas</TabsTrigger>
                        <TabsTrigger value="pending">Pendientes</TabsTrigger>
                        <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto order-1 xl:order-2 justify-between">
                    <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                        <Shield className={`w-4 h-4 ${moderationEnabled ? 'text-violet-400' : 'text-slate-500'}`} />
                        <Label htmlFor="moderation-mode" className="text-sm font-medium text-slate-300">
                            Moderación Manual
                        </Label>
                        <Switch
                            id="moderation-mode"
                            checked={moderationEnabled}
                            onCheckedChange={handleModerationToggle}
                        />
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownloadZip}
                        disabled={isDownloading}
                        className="w-full sm:w-auto"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {downloadProgress}%
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Descargar ZIP ({photos.length})
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Grid Status Info */}
            <div className="text-sm text-slate-400 px-1">
                Mostrando {filteredPhotos.length} fotos {filter !== 'all' && <span>({filter})</span>}
            </div>

            {filteredPhotos.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    <p className="text-slate-400">No hay fotos en esta categoría</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            className={`group relative aspect-square overflow-hidden rounded-xl border ${photo.status === 'rejected' ? 'border-red-500/30 opacity-70' :
                                photo.status === 'pending' ? 'border-yellow-500/30' :
                                    'border-slate-800'
                                } bg-slate-900 cursor-pointer`}
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <Image
                                src={photo.url}
                                alt={photo.caption || 'Foto del evento'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 20vw"
                            />

                            {/* Overlay actions on hover */}
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform flex justify-between items-center">
                                <span className="text-xs text-white truncate max-w-[60%]">
                                    {photo.caption || 'Sin título'}
                                </span>
                                {getStatusBadge(photo.status)}
                            </div>

                            {/* Status indicator icon top-right */}
                            <div className="absolute top-2 right-2">
                                {photo.status === 'approved' && <div className="bg-green-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
                                {photo.status === 'rejected' && <div className="bg-red-500 rounded-full p-1"><X className="w-3 h-3 text-white" /></div>}
                                {photo.status === 'pending' && <div className="bg-yellow-500 rounded-full p-1"><AlertCircle className="w-3 h-3 text-white" /></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="max-w-4xl bg-black/95 border-slate-800 p-0 overflow-hidden h-[85vh] flex flex-col md:flex-row">
                    <div className="relative flex-1 bg-black flex items-center justify-center p-4">
                        {selectedPhoto && (
                            <div className="relative w-full h-full max-h-full">
                                <Image
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.caption || 'Detalle'}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-80 bg-slate-950 p-6 flex flex-col gap-4 border-l border-slate-800">
                        <div className="space-y-4 flex-1">
                            <div>
                                <h3 className="text-white font-bold text-lg">Detalles de la Foto</h3>
                                <div className="mt-2 flex items-center gap-2">
                                    {selectedPhoto && getStatusBadge(selectedPhoto.status)}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Descripción</label>
                                <p className="text-slate-300 text-sm italic">
                                    "{selectedPhoto?.caption || 'Sin descripción'}"
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase tracking-wider">Subida el</label>
                                <p className="text-slate-300 text-sm">
                                    {selectedPhoto?.uploaded_at ? format(new Date(selectedPhoto.uploaded_at), "PPp", { locale: es }) : 'N/A'}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Acciones de Moderación</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className={`w-full ${selectedPhoto?.status === 'approved' ? 'border-green-500 text-green-500' : 'hover:border-green-500 hover:text-green-500'}`}
                                        onClick={() => selectedPhoto && handleStatusUpdate(selectedPhoto.id, 'approved')}
                                        disabled={selectedPhoto?.status === 'approved'}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Aprobar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`w-full ${selectedPhoto?.status === 'rejected' ? 'border-red-500 text-red-500' : 'hover:border-red-500 hover:text-red-500'}`}
                                        onClick={() => selectedPhoto && handleStatusUpdate(selectedPhoto.id, 'rejected')}
                                        disabled={selectedPhoto?.status === 'rejected'}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Rechazar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Zona de Peligro
                            </h4>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar Permanentemente
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md bg-slate-950 border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Esta acción no se puede deshacer. La foto será eliminada permanentemente de la base de datos y del almacenamiento.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => { }}>Cancelar</Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => selectedPhoto && handleDelete(selectedPhoto.id, selectedPhoto.url)}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar foto'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
