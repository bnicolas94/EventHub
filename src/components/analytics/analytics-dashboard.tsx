'use client';

import { DashboardMetrics } from '@/app/actions/analytics';
import { KPICard } from './kpi-card';
import { Users, UserCheck, UserX, Clock, Utensils, AlertTriangle, Image as ImageIcon, Download } from 'lucide-react';
import { ResponseTimeline } from './charts/response-timeline';
import { DietaryStats } from './charts/dietary-stats';
import { Button } from '@/components/ui/button';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
    metrics: DashboardMetrics;
    eventName: string;
}

export function AnalyticsDashboard({ metrics, eventName }: AnalyticsDashboardProps) {

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(20);
            doc.text(`Reporte de Analíticas: ${eventName}`, 14, 22);
            doc.setFontSize(10);
            doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

            // KPIs Table
            autoTable(doc, {
                startY: 35,
                head: [['Métrica', 'Valor']],
                body: [
                    ['Total Invitados', metrics.totalGuests],
                    ['Confirmados', metrics.confirmedGuests],
                    ['Pendientes', metrics.pendingGuests],
                    ['Rechazados', metrics.declinedGuests],
                    ['Tasa de Confirmación', `${metrics.confirmationRate}%`],
                    ['Acompañantes Confirmados', metrics.plusOnesConfirmed],
                    ['Fotos Subidas', metrics.totalPhotos]
                ],
            });

            // Diet Stats Table
            const dietData = metrics.dietaryStats.map(stat => [stat.name, stat.value]);
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Preferencia Alimenticia', 'Cantidad']],
                body: dietData,
            });

            doc.save(`reporte_analiticas_${eventName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
            toast.success('Reporte PDF descargado');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar el PDF');
        }
    };

    const handleDownloadCSV = () => {
        // Simple CSV export for now
        const headers = "Métrica,Valor\n";
        const rows = [
            `Total Invitados,${metrics.totalGuests}`,
            `Confirmados,${metrics.confirmedGuests}`,
            `Pendientes,${metrics.pendingGuests}`,
            `Rechazados,${metrics.declinedGuests}`,
            `Tasa Confirmación,${metrics.confirmationRate}%`,
            `Acompañantes,${metrics.plusOnesConfirmed}`,
            `Fotos,${metrics.totalPhotos}`
        ].join("\n");

        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `kpis_${eventName.replace(/\s+/g, '_').toLowerCase()}.csv`);
        toast.success('CSV exportado');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Resumen General</h2>
                    <p className="text-sm text-slate-400">Estado actual del evento en tiempo real.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Reporte PDF
                    </Button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Confirmados"
                    value={metrics.confirmedGuests}
                    icon={UserCheck}
                    description={`${metrics.confirmationRate}% del total`}
                    className="bg-emerald-950/20 border-emerald-900/50"
                />
                <KPICard
                    title="Pendientes"
                    value={metrics.pendingGuests}
                    icon={Clock}
                    className="bg-amber-950/20 border-amber-900/50"
                />
                <KPICard
                    title="Rechazados"
                    value={metrics.declinedGuests}
                    icon={UserX}
                    className="bg-red-950/20 border-red-900/50"
                />
                <KPICard
                    title="Fotos Subidas"
                    value={metrics.totalPhotos}
                    icon={ImageIcon}
                    className="bg-violet-950/20 border-violet-900/50"
                />
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Timeline - Takes up 4 columns */}
                <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-400" />
                        Evolución de Confirmaciones
                    </h3>
                    <ResponseTimeline data={metrics.timelineData} />
                </div>

                {/* Diet Stats - Takes up 3 columns */}
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-emerald-400" />
                        Preferencias Alimenticias
                    </h3>
                    <DietaryStats data={metrics.dietaryStats} />
                </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Invitados sin Mesa"
                    value={metrics.guestsWithoutTable}
                    icon={AlertTriangle}
                    description="Requieren asignación"
                    className="bg-slate-900 border-slate-800"
                />
                <KPICard
                    title="Total Invitados"
                    value={metrics.totalGuests}
                    icon={Users}
                    className="bg-slate-900 border-slate-800"
                />
                <KPICard
                    title="Acompañantes (+1)"
                    value={metrics.plusOnesConfirmed}
                    icon={Users}
                    description="Confirmados adicionales"
                    className="bg-slate-900 border-slate-800"
                />
            </div>
        </div>
    );
}
