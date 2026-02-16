'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Shield,
    CreditCard,
    Users,
    Palette,
    BarChart3,
    LogOut,
    ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const adminNav = [
    { name: 'Tenants', href: '/admin/tenants', icon: Users },
    { name: 'Planes', href: '/admin/plans', icon: CreditCard },
    { name: 'Plantillas', href: '/admin/templates', icon: Palette },
    { name: 'Analíticas', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success('Sesión cerrada');
        router.push('/');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Admin Sidebar */}
            <aside className="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-2 px-4 h-16 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold tracking-tight">
                            Event<span className="text-red-400">Hub</span>
                        </span>
                        <p className="text-[10px] text-red-400/80 -mt-1 font-medium uppercase tracking-widest">
                            System Admin
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {adminNav.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-red-600/20 text-red-300 shadow-sm shadow-red-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }
                `}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-3 border-t border-white/5 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al sitio
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen lg:pl-0">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-red-400" />
                        <h1 className="text-lg font-semibold">
                            {adminNav.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Panel de Administración'}
                        </h1>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
