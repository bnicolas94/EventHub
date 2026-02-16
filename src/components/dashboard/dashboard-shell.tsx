
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sparkles,
    LayoutDashboard,
    Users,
    Mail,
    Camera,
    LayoutGrid,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    CalendarDays,
    Menu,
    X,
    Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { EventSelector } from '@/components/dashboard/event-selector';
import { setActiveEvent } from '@/app/actions/events';


import { useEffect } from 'react';
import { useAuthStore, useEventStore } from '@/lib/stores';
import { Tenant, Event } from '@/lib/types';

interface DashboardShellProps {
    children: React.ReactNode;
    initialEvents: Pick<Event, 'id' | 'name'>[];
    initialActiveEventId: string;
    userEmail: string;
    initialTenant?: Tenant;
}


export function DashboardShell({
    children,
    initialEvents,
    initialActiveEventId,
    userEmail,
    initialTenant
}: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Initialize stores with server data
    const setTenant = useAuthStore((state) => state.setTenant);
    const setUser = useAuthStore((state) => state.setUser);
    const setEvents = useEventStore((state) => state.setEvents);
    const setCurrentEvent = useEventStore((state) => state.setCurrentEvent);
    const setIsLoading = useAuthStore((state) => state.setIsLoading);

    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('upgrade') === 'true') {
            toast.error('Función Premium', {
                description: 'Esta funcionalidad solo está disponible en planes superiores.',
                action: {
                    label: 'Ver Planes',
                    onClick: () => router.push('/dashboard/settings/billing')
                }
            });
            // Limpiar el parámetro de la URL sin recargar
            const url = new URL(window.location.href);
            url.searchParams.delete('upgrade');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (initialTenant) {
            setTenant(initialTenant);
        }
        setIsLoading(false);
        // Minimal user object for store context
        setUser({ email: userEmail } as any);

        // Sync events
        setEvents(initialEvents as any); // Cast to any to avoid strict type mismatch for now

        if (initialActiveEventId) {
            const active = initialEvents.find(e => e.id === initialActiveEventId);
            if (active) setCurrentEvent(active as any);
        }
    }, [initialTenant, userEmail, setTenant, setUser, initialEvents, setEvents, setCurrentEvent, initialActiveEventId]);


    // We can rely on server-injected props + router.refresh() 
    // to keep this updated, instead of internal activeEventId state via useEffect.
    // However, for snappy local optimistic UI, we might want local state too,
    // but cleaner is to rely on props directly especially for the selector.
    // The EventSelector takes `activeEventId` prop.

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success('Sesión cerrada');
        router.push('/login');
        router.refresh();
    };

    // Navigation items
    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Eventos', href: '/dashboard/events', icon: CalendarDays },
        { name: 'Invitados', href: '/dashboard/guests', icon: Users },
        { name: 'Mesas', href: '/dashboard/tables', icon: LayoutGrid },
        { name: 'Cronograma', href: '/dashboard/timeline', icon: Clock },
        { name: 'Invitaciones', href: '/dashboard/invitations', icon: Mail },
        { name: 'Fotos', href: '/dashboard/photos', icon: Camera },
        { name: 'Métricas', href: '/dashboard/analytics', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-slate-900/80 backdrop-blur-xl border-r border-white/5
          flex flex-col transition-all duration-300 ease-out
        `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        {!collapsed && (
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                                Event<span className="text-violet-400">Hub</span>
                            </span>
                        )}
                    </Link>
                    {/* Mobile close */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-violet-600/20 text-violet-300 shadow-sm shadow-violet-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }
                  ${collapsed ? 'justify-center' : ''}
                `}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="hidden lg:flex px-3 py-3 border-t border-white/5">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <>
                                <ChevronLeft className="w-4 h-4" />
                                <span>Colapsar</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-none">
                            {navigation.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
                        </h1>
                    </div>


                    <div className="hidden sm:block">
                        {initialEvents.length > 0 && (
                            <EventSelector
                                events={initialEvents}
                                activeEventId={initialActiveEventId} // Passed from server, updated on refresh
                                setActiveEventAction={setActiveEvent}
                            />
                        )}
                    </div>


                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 rounded-full hover:bg-white/10"
                                suppressHydrationWarning={true}
                            >
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-medium">
                                        {userEmail.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-slate-900 border-white/10 text-white"
                        >
                            <div className="px-2 py-1.5 sm:hidden border-b border-white/5 mb-1 pb-3">
                                <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Cambiar Evento</p>
                                <EventSelector
                                    events={initialEvents}
                                    activeEventId={initialActiveEventId} // Passed from server, updated on refresh
                                    setActiveEventAction={setActiveEvent}
                                />

                            </div>
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium">Mi Cuenta</p>
                                <p className="text-xs text-slate-400">{userEmail}</p>
                            </div>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Configuración
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="hover:bg-white/5 cursor-pointer text-red-400"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

