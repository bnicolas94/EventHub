# EventHub — Plan Detallado de Desarrollo

## Fase 0: Planificación
- [x] Leer PRD completo
- [x] Analizar referencia GreetingsIsland (editor drag & drop)
- [x] Escribir implementation_plan.md
- [x] Obtener aprobación del usuario
- [x] Resolver preguntas (stack confirmado, Fabric.js, dev local, MVP, pagos V1, System Owner role)

## Fase 1: Fundación (Sprint 1-2, Semanas 1-4)
- [x] Inicializar proyecto Next.js + Tailwind + shadcn/ui (dev local)
- [x] Schema de BD: migration SQL con 11 tablas + indexes + RLS + seed
- [x] Tipos TypeScript completos para todas las entidades
- [x] Supabase clients (browser, server, service-role, middleware)
- [x] Middleware de autenticación con protección de rutas
- [x] Landing page premium con hero + features + CTA
- [x] Login y Register con Supabase Auth + glassmorphic UI
- [x] API `/api/auth/register` (crea tenant + user con plan Free)
- [x] Zustand stores (auth, events)
- [/] Dashboard layout con sidebar
- [x] Panel de System Owner (gestión de planes, precios, features)
- [x] Configurar Supabase (cuando el usuario tenga proyecto creado)

## Fase 2: Core MVP (Sprint 3-4, Semanas 5-8)
- [ ] Dashboard del organizador con métricas
- [x] CRUD básico de invitados (añadir manual, editar, borrar)
- [x] Importación masiva de invitados (Excel .xlsx y .xls)
- [x] Estados de invitación (pending, confirmed, declined, tentative)
- [x] Editor de invitaciones drag & drop (estilo GreetingsIsland)
- [x] Página de RSVP pública para invitados
  - [x] Formulario de confirmación (asistencia, dieta, acompañantes)
  - [x] Visualizador de la invitación diseñada (integración con Editor)
  - [ ] Stickers/elementos decorativos
  - [x] Subida de imágenes
- [ ] Generación de links únicos por invitado
- [ ] Página pública del invitado (evento + confirmación)
- [ ] Integración email (Resend)

## Fase 3: Features Estrella (Sprint 5-6, Semanas 9-12)
- [ ] Portal de fotos colaborativo
  - [ ] Subida con compresión client-side
  - [ ] Galería compartida con lazy loading
  - [ ] Moderación para organizadores
  - [ ] Storage en Cloudflare R2
- [ ] Gestión visual de mesas (drag & drop)
  - [ ] Canvas con mesas posicionables
  - [ ] Asignación de invitados a mesas
  - [ ] Sistema de restricciones/conflictos
- [ ] Preferencias alimenticias (dashboard + exportación)
- [ ] Mapa interactivo (Google Maps)

## Fase 4: Comunicación y Reportes (Sprint 7-8, Semanas 13-16)
- [ ] Sistema de comunicaciones (invitaciones, recordatorios, anuncios)
- [ ] Editor WYSIWYG de mensajes
- [ ] Scheduling de envíos
- [ ] Dashboard de analíticas y reportes
- [ ] Exportaciones (PDF, CSV)
- [ ] Checklist inteligente

## Fase 5: Pulido y Lanzamiento
- [ ] Light/Dark mode
- [ ] Mobile optimizations
- [ ] Testing E2E
- [ ] Deploy a producción (Vercel + Supabase)
- [ ] Documentación
