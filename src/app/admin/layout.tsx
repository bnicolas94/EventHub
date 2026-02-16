
import { checkSystemAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isAdmin = await checkSystemAdmin();

    if (!isAdmin) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto h-16 flex items-center justify-between px-4">
                    <div className="flex items-center gap-8">
                        <Link href="/admin" className="font-bold text-xl text-amber-500">
                            EventHub Admin
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/admin" className="text-white hover:text-amber-400 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/admin/tenants" className="text-slate-300 hover:text-amber-400 transition-colors">
                                Tenants
                            </Link>
                            <Link href="/admin/plans" className="text-slate-300 hover:text-amber-400 transition-colors">
                                Planes
                            </Link>
                        </nav>
                    </div>
                    <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                        Volver al App
                    </Link>
                </div>
            </header>
            <main className="container mx-auto py-8 px-4">
                {children}
            </main>
        </div>
    );
}
