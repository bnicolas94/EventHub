'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const supabase = createClient();

            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        org_name: orgName,
                    },
                },
            });

            if (authError) {
                toast.error('Error al registrarse', { description: authError.message });
                return;
            }

            if (!authData.user) {
                toast.error('No se pudo crear el usuario');
                return;
            }

            // 2. Create tenant + user via API (server-side to use service role)
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_id: authData.user.id,
                    email,
                    full_name: fullName,
                    org_name: orgName,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                toast.error('Error al crear la organización', { description: error.message });
                return;
            }

            toast.success('¡Cuenta creada exitosamente!', {
                description: 'Revisá tu email para confirmar la cuenta.',
            });
            router.push('/dashboard');
            router.refresh();
        } catch {
            toast.error('Error inesperado. Intentá nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center space-y-4">
                <Link href="/" className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">
                        Event<span className="text-violet-400">Hub</span>
                    </span>
                </Link>
                <CardTitle className="text-xl text-white">Crear cuenta</CardTitle>
                <CardDescription className="text-slate-400">
                    Registrate gratis y empezá a organizar tus eventos
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-slate-300">Nombre completo</Label>
                        <Input
                            id="fullName"
                            placeholder="Juan Pérez"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="orgName" className="text-slate-300">Nombre de la organización</Label>
                        <Input
                            id="orgName"
                            placeholder="Eventos Elite / Mi nombre"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear cuenta gratis'
                        )}
                    </Button>
                    <p className="text-sm text-slate-400 text-center">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                            Iniciar sesión
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
