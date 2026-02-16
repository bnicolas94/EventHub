'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Upload, FileDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { importGuests } from '@/app/actions/guests';
import * as XLSX from 'xlsx';

interface ImportGuestsDialogProps {
    eventId: string;
}

export function ImportGuestsDialog({ eventId }: ImportGuestsDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Header array

                if (jsonData.length < 2) {
                    setErrors(['El archivo parece estar vacío o no tener datos suficientes.']);
                    setPreview([]);
                    return;
                }

                // Extract headers and data
                const headers = (jsonData[0] as string[]).map(h => h.trim().toLowerCase());
                const rows = jsonData.slice(1);

                // Validate headers
                // We want flexibility: 'nombre', 'apellido', 'email', 'telefono' OR 'first_name', 'last_name'...
                // Mapping for user convenience:
                // nombre -> first_name
                // apellido -> last_name
                // email -> email
                // telefono, cel, movil -> phone
                // categoria -> category
                // acompañantes, cupo -> companion_limit

                // Let's create a map function later. For preview, just show first 5 rows
                const previewData = rows.slice(0, 5).map((row: any) => {
                    const obj: any = {};
                    headers.forEach((h, i) => {
                        obj[h] = row[i];
                    });
                    return obj;
                });

                setPreview(previewData);
                setErrors([]);
            } catch (err) {
                console.error(err);
                setErrors(['Error al leer el archivo Excel. Asegúrate de que no esté corrupto.']);
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const headers = ['Nombre', 'Apellido', 'Email', 'Telefono', 'Categoria', 'Acompañantes'];
        const sampleData = [
            ['Juan', 'Perez', 'juan@ejemplo.com', '11223344', 'Amigos', 1],
            ['Maria', 'Gomez', 'maria@ejemplo.com', '', 'Familia', 0]
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        XLSX.utils.book_append_sheet(wb, ws, "Invitados");
        XLSX.writeFile(wb, "plantilla_invitados.xlsx");
    };

    const mapRowToGuest = (row: any, headers: string[]) => {
        const guest: any = {
            first_name: '',
            last_name: '',
            category: 'General',
            companion_limit: 0
        };

        // Smart mapping
        headers.forEach((h, i) => {
            const val = row[i];
            if (!val) return;

            const header = h.toLowerCase().trim();
            const valueStr = String(val).trim();

            if (header.includes('nombre') || header === 'first_name') guest.first_name = valueStr;
            else if (header.includes('apellido') || header === 'last_name') guest.last_name = valueStr;
            else if (header.includes('email') || header.includes('correo')) guest.email = valueStr;
            else if (header.includes('telefono') || header.includes('cel') || header === 'phone') guest.phone = valueStr;
            else if (header.includes('categoria') || header === 'category' || header === 'grupo') guest.category = valueStr;
            else if (header.includes('acompañante') || header.includes('cupo') || header.includes('limit')) guest.companion_limit = parseInt(valueStr) || 0;
        });

        return guest;
    };

    const handleSubmit = async () => {
        if (!file || !eventId) return;

        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const headers = (jsonData[0] as string[]).map(h => String(h));
                const rows = jsonData.slice(1);

                const guests = rows.map((row: any) => mapRowToGuest(row, headers))
                    .filter((g: any) => g.first_name); // Filter empty

                if (guests.length === 0) {
                    toast.error('No se encontraron invitados válidos');
                    setIsLoading(false);
                    return;
                }

                // Call server action
                const result = await importGuests(guests, eventId);

                if (result.success) {
                    toast.success(`${result.count} invitados importados`);
                    setOpen(false);
                    setFile(null);
                    setPreview([]);
                } else {
                    toast.error(result.error);
                }
            } catch (err) {
                toast.error('Error al procesar el archivo');
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importar Invitados (Excel)</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx, .xls) con tu lista de invitados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Template Download */}
                    <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-400">Plantilla Excel</p>
                            <p className="text-xs text-slate-400">Usa este formato (Nombre, Apellido, Email, etc.)</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                            <FileDown className="w-4 h-4 mr-2" />
                            Descargar .xlsx
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>Seleccionar Archivo</Label>
                        <Input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="bg-white/5 border-white/10 cursor-pointer file:text-white file:bg-white/10 file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1"
                        />
                    </div>

                    {/* Error Message */}
                    {errors.length > 0 && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {errors.map((err, i) => <p key={i}>{err}</p>)}
                        </div>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <Label>Vista Previa (primeras 5 filas)</Label>
                            <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-slate-500 border-b border-white/10">
                                        <tr>
                                            {Object.keys(preview[0]).map((h, i) => (
                                                <th key={i} className="pb-1 px-2 capitalize">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b border-white/5 last:border-0">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="py-1 px-2">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-2 text-slate-500 italic">... y más filas.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!file || errors.length > 0 || isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Importar Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
