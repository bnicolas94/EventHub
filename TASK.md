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
- [x] Dashboard layout con sidebar completo
- [x] Panel de System Owner (gestión de planes, precios, features)
- [x] Configurar Supabase (cuando el usuario tenga proyecto creado)

## Fase 2: Core MVP (Sprint 3-4, Semanas 5-8)
- [x] Dashboard del organizador con métricas y sincronización por evento
- [x] CRUD básico de invitados (añadir manual, editar, borrar)
- [x] Importación masiva de invitados (Excel .xlsx y .xls)
- [x] Estados de invitación (pending, confirmed, declined, tentative)
- [x] Editor de invitaciones drag & drop (estilo GreetingsIsland)
- [x] Checklist inteligente con progreso funcional e inicialización automática
- [x] Página de RSVP pública para invitados
  - [x] Formulario de confirmación (asistencia, dieta, acompañantes)
  - [x] Visualizador de la invitación diseñada (integración con Editor)
  - [x] Subida de imágenes funcional
- [x] Generación de links únicos por invitado persistente

## Fase 3: Comunicación e Invitaciones (Sprint 5, Semanas 9-10)
- [x] Integración con Resend para envío de emails (Individual y Masivo)
- [x] Diseño de template de email premium (HTML persistente)
- [x] Control de Rate Limit y reporte detallado de errores
- [x] Integración con WhatsApp (Link de invitación directo)

## Fase 4: Features Estrella (Sprint 6-8, Semanas 11-16)
- [x] Portal de fotos colaborativo
  - [x] Schema BD (tabla photos) y Storage Bucket
  - [x] Service Layer (DAL) para fotos
  - [x] Server Actions (upload, delete, list)
  - [x] Componentes UI (Gallery, UploadWidget, Bulk Upload)
  - [x] Página pública para invitados
- [x] Gestión visual de mesas (drag & drop en Canvas)
  - [x] Asignación de invitados a mesas
  - [x] Verificar asignación drag-and-drop
  - [x] Sistema de restricciones/conflictos de capacidad
  - [x] Solucionar error al guardar cambios (update vs upsert)
- [x] Mapa interactivo (OpenStreetMap / Leaflet)
  - [x] Instalar `leaflet` y `react-leaflet`
  - [x] Componente `LocationPicker` (Dashboard: Selector de ubicación)
  - [x] Componente `EventMap` (RSVP: Visualizador de ubicación)
  - [x] Actualizar DB: Usar columnas lat/lng (o adaptar POINT)
  - [x] Integrar en Dashboard (Settings) y RSVP
- [x] Dashboard avanzado de analíticas y reportes
  - [x] Server Action: `getEventAnalytics` (KPIs, Cronología, Estadísticas de Dieta)
  - [x] UI: KPIs Cards (Confirmaciones, Tiempo respuesta, Invitados sin mesa)
  - [x] UI: Gráficos (Confirmaciones por día, Restricciones alimenticias)
  - [x] Exportaciones: CSV Confirmados y PDF Reporte General
- [x] Portal de Moderación de Fotos (Dashboard)
  - [x] Página `/dashboard/events/[eventId]/photos`
  - [x] Server Action `updatePhotoStatus`
  - [x] UI de Grid con acciones (Aprobar/Rechazar/Borrar)
- [x] Mejoras Moderación Fotos (PRD)
  - [x] Descarga Masiva (ZIP) - Client-side con JSZip
  - [x] Toggle "Moderación Manual" (Event Settings)
  - [x] Actualizar lógica de subida (`uploadPhoto`) según configuración
- [x] Arreglar Visualizador de Invitación (RSVP)
  - [x] Debug de Fabric.js en `RSVPViewerWrapper` (SSR manejado con importación dinámica)
  - [x] Descomentar componente en `page.tsx`

## Fase 5: Gestión de Eventos y Cronograma
- [x] Gestión de Eventos (CRUD Completo)
  - [x] Backend: `createEvent`, `deleteEvent`, `getEventById` (Server Actions)
  - [x] UI: Listado de eventos (`/dashboard/events`) con buscador y filtro
  - [x] UI: Diálogo de creación con validación Zod
  - [x] UI: Página de edición (`/dashboard/events/[id]`)
  - [x] Navegación: Integrar en Sidebar y Layout
- [x] Cronograma del Evento (Timeline)
  - [x] DB: Tabla `event_timeline_items` con RLS
  - [x] Backend: Actions para CRUD y Reordenamiento
  - [x] UI Dashboard: Gestor Drag & Drop (`dnd-kit`) en `/dashboard/events/[id]/timeline`
  - [x] UI RSVP: Nueva pestaña "Cronograma" con vista pública
  - [x] Integración: Mostrar automáticamente en RSVP si hay items


- [x] Auditoría Profunda de Cambio de Evento
  - [x] Verificar `Invitados` (Key Prop Fix aplicado)
  - [x] Verificar `Fotos` (Key Prop Fix aplicado)
  - [x] Verificar `Analíticas` (Key Prop Fix aplicado)
  - [x] Verificar `Dashboard` Principal (Key Prop Fix aplicado)
- [x] Arreglar cambio de contexto de evento
  - [x] Verificar `EventSelector` y `setActiveEvent` cookie
  - [x] Verificar `getDashboardMetrics` usa el evento activo
  - [x] Asegurar que todas las páginas del dashboard respondan al cambio de evento activo (Key Prop Fix aplicado en Tables, Settings, Timeline)


- [x] Restaurar Location Picker en Configuración
  - [x] Agregar `LocationPicker` a `EditEventForm`



## Fase 6: Restricciones y Planes (SaaS Limits)
- [x] Backend: Plan Helpers (`src/lib/plans.ts`)
- [x] Backend: Restricción de Límite de Eventos (`createEvent`)
- [x] Backend: Restricción de Límite de Invitados (`createGuest`, `importGuests`)
- [x] Frontend: Inyectar Plan actual en `DashboardLayout` -> `DashboardShell`
- [x] Frontend: Componente `FeatureGate` para bloqueo de UI
- [x] Frontend: UI de Bloqueo en Eventos (Botón Nuevo Evento)
- [x] Frontend: UI de Bloqueo en Mesas (Si plan Free)
- [x] Frontend: UI de Bloqueo en Branding (Configuración)

## Fase 7: Admin Panel (System Owner)
- [x] Backend: Server Actions para Admin (`src/app/actions/admin.ts`)
- [x] Frontend: Admin Layout (`src/app/admin/layout.tsx`) con auth guard
- [x] Frontend: Admin Dashboard Page (`src/app/admin/page.tsx`)
- [x] Frontend: Componente `TenantList` con tabla de tenants
- [x] Frontend: Dialog `ChangePlanDialog` para modificar planes

## Fase 8: Admin Restoration & Fixes
- [x] Backend: Debug & Fix `updateTenantPlan` (Logs + Validation)
- [x] Refactor: Mover Tenant List a `/admin/tenants`
- [x] Frontend: Admin Dashboard Page (`/admin`) con Analytics
- [x] Frontend: Plans Management Page (`/admin/plans`)
- [ ] Backend: Server Actions para Analytics y Planes

## Fase 9: Admin Fixes & Enhancements
- [x] Fix: `/admin/tenants` 404 (File vs Directory)
- [ ] Backend: `updateSubscriptionPlan` action
- [ ] Frontend: `EditPlanDialog` component
- [ ] Frontend: Integrate Edit Dialog in `/admin/plans`

## Fase 10: Feature Gating & Limits Enforcement
- [x] Verify Free Plan functionality restriction
- [x] Implement Server-Side Gating (Page Level)
- [x] Implement Component-Level Gating (Tables, Timeline, etc.)
- [x] Enforce usage limits (Events, Guests, Storage)
- [x] Bug: Fix plan structure mismatch in Tables/FeatureGate
