import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  Camera,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-950/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Event<span className="text-violet-400">Hub</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Planes
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40">
                Crear cuenta
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
            <Star className="w-4 h-4" />
            Plataforma #1 de gestión de eventos
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent leading-tight">
            Organiza eventos
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              extraordinarios
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Invitaciones con editor drag & drop, distribución visual de mesas,
            galería de fotos colaborativa y mucho más. Todo en una sola
            plataforma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-500/25 text-base px-8 py-6 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-105"
              >
                Comenzar gratis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white text-base px-8 py-6"
            >
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitás para tu evento
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Herramientas profesionales diseñadas para organizadores exigentes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Invitaciones D&D",
                description:
                  "Editor visual drag & drop con plantillas elegantes y personalización total",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                icon: Users,
                title: "Gestión de invitados",
                description:
                  "RSVP automático, preferencias alimenticias y control total de asistencia",
                gradient: "from-blue-500 to-cyan-600",
              },
              {
                icon: LayoutGrid,
                title: "Distribución de mesas",
                description:
                  "Diseñá la distribución de tu salón con drag & drop visual e inteligente",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                icon: Camera,
                title: "Galería colaborativa",
                description:
                  "Tus invitados suben fotos del evento. Moderación, descarga masiva y más",
                gradient: "from-amber-500 to-orange-600",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para organizar tu próximo evento?
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                Creá tu cuenta gratuita y empezá a planificar hoy. Sin tarjeta
                de crédito.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 shadow-2xl text-base px-8 py-6 transition-all duration-300 hover:scale-105"
                >
                  Comenzar ahora
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">EventHub</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} EventHub. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
