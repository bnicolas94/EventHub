# Product Requirements Document (PRD)
## EventHub - Plataforma SaaS de Gestión de Eventos Sociales

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** Draft inicial para desarrollo

---

## 1. Visión del Producto

### 1.1 Descripción General
EventHub es una plataforma web SaaS multi-tenant diseñada para digitalizar y optimizar la organización de eventos sociales (bodas, cumpleaños de 15, aniversarios, eventos corporativos pequeños). El producto ofrece herramientas profesionales de gestión a organizadores mientras proporciona una experiencia elegante y simple a los invitados.

### 1.2 Propuesta de Valor
- **Para organizadores:** Dashboard completo que centraliza invitaciones, distribución de mesas, gestión de preferencias alimenticias y comunicación con invitados
- **Para invitados:** Experiencia mobile-first simple para confirmar asistencia, compartir preferencias y colaborar con fotos del evento
- **Diferenciador clave:** Portal de fotos colaborativo con optimización de almacenamiento y moderación

### 1.3 Modelo SaaS Multi-Tenant
Cada cliente (organizador de eventos) opera en su propio espacio aislado (tenant), compartiendo la misma infraestructura pero con datos completamente segregados. Un tenant puede contener múltiples eventos.

**Estrategia de aislamiento:**
- Base de datos: Schema per tenant o particionamiento por tenant_id
- Almacenamiento: Estructura de carpetas S3: `/{tenant_id}/{event_id}/`
- Autenticación: JWT con claim de tenant_id

---

## 2. Arquitectura del Sistema

### 2.1 Modelo Multi-Tenant

```
EventHub Platform
│
├── Tenant A (Empresa organizadora "Eventos Elite")
│   ├── Evento 1: Boda María & Juan
│   ├── Evento 2: 15 años Sofía
│   └── Evento 3: Aniversario Corporativo
│
├── Tenant B (Organizadora independiente "Ana López")
│   └── Evento 1: Casamiento Pedro & Laura
│
└── Tenant C (Usuario individual)
    └── Evento 1: Mi cumpleaños 40
```

### 2.2 Entidades Principales

```
Tenant
├── id
├── name
├── subscription_plan
├── storage_quota_mb
├── events_limit
└── created_at

Event
├── id
├── tenant_id (FK)
├── name
├── date
├── location_address
├── location_coordinates
├── dress_code
├── custom_message
├── max_guests
├── status (draft, active, completed, archived)
└── settings (JSON: branding, notifications, etc.)

User (Organizadores)
├── id
├── tenant_id (FK)
├── email
├── role (owner, admin, collaborator)
└── permissions

Guest
├── id
├── event_id (FK)
├── full_name
├── email
├── phone
├── invitation_token (UUID único)
├── rsvp_status (pending, confirmed, declined)
├── plus_ones_allowed
├── plus_ones_confirmed
├── dietary_restrictions (JSON)
└── table_assignment_id (FK nullable)

Table
├── id
├── event_id (FK)
├── table_number
├── capacity
├── x_position (para drag & drop)
├── y_position
└── notes

Photo
├── id
├── event_id (FK)
├── uploaded_by_guest_id (FK)
├── file_path (S3 key)
├── file_size_bytes
├── thumbnail_path
├── moderation_status (pending, approved, rejected)
├── uploaded_at
└── metadata (JSON: original_filename, dimensions, etc.)

Communication
├── id
├── event_id (FK)
├── type (invitation, reminder, announcement)
├── sent_at
├── recipients_count
└── content
```

### 2.3 Diagrama de Relaciones

```
Tenant (1) ──── (N) Events
Event (1) ──── (N) Guests
Event (1) ──── (N) Tables
Event (1) ──── (N) Photos
Tenant (1) ──── (N) Users
Guest (1) ──── (0..1) Table
Guest (1) ──── (N) Photos
```

---

## 3. Roles y Permisos

### 3.1 Jerarquía de Roles

**Tenant Owner** (propietario de la cuenta SaaS)
- Gestión completa del tenant
- Facturación y suscripciones
- Crear/eliminar eventos
- Asignar colaboradores

**Event Organizer** (organizador del evento específico)
- Gestión completa del evento asignado
- Invitar co-organizadores
- Todas las funciones del dashboard

**Event Collaborator** (co-organizador)
- Permisos configurables por evento
- Ejemplo: puede gestionar invitados pero no enviar comunicaciones

**Guest** (invitado)
- Solo acceso a su propia vista de invitado
- Autenticado mediante token único
- No requiere crear cuenta

### 3.2 Matriz de Permisos

| Funcionalidad | Owner | Organizer | Collaborator | Guest |
|--------------|-------|-----------|--------------|-------|
| Gestionar tenant | ✅ | ❌ | ❌ | ❌ |
| Crear eventos | ✅ | ✅ | ❌ | ❌ |
| Gestionar invitados | ✅ | ✅ | ⚙️ | ❌ |
| Diseñar distribución mesas | ✅ | ✅ | ⚙️ | ❌ |
| Enviar comunicaciones | ✅ | ✅ | ⚙️ | ❌ |
| Moderar fotos | ✅ | ✅ | ⚙️ | ❌ |
| Confirmar asistencia | ❌ | ❌ | ❌ | ✅ |
| Subir fotos | ❌ | ❌ | ❌ | ✅ |

⚙️ = Configurable por el organizador

---

## 4. Funcionalidades del Organizador

### 4.1 Dashboard Principal

**Componentes del Dashboard:**

```
┌─────────────────────────────────────────────────┐
│  EventHub Dashboard                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Métricas Rápidas                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 87/120   │ │ 72.5%    │ │ 15       │       │
│  │Confirmados│ │Tasa Conf.│ │Pendientes│       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  📋 Checklist de Organización                   │
│  ☑ Enviar invitaciones (100%)                  │
│  ☑ Confirmar locación (Completo)               │
│  ☐ Distribuir mesas (60%)                      │
│  ☐ Enviar recordatorio (Pendiente)             │
│                                                 │
│  🔔 Notificaciones Recientes                    │
│  • María Pérez confirmó asistencia             │
│  • Juan López rechazó invitación               │
│  • Nueva foto subida por Ana García            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.2 Gestión de Invitados

**Funcionalidades Core:**

1. **Alta de Invitados**
   - Formulario manual: nombre, email, teléfono, grupo, plus ones permitidos
   - Importación masiva CSV con validación de formato
   - Campos personalizados opcionales (ej: relación con agasajado)

2. **Estados de Invitación**
   ```
   PENDING (amarillo) → usuario no respondió
   CONFIRMED (verde) → confirmó asistencia + info adicional
   DECLINED (rojo) → rechazó asistencia
   TENTATIVE (azul) → confirmó parcialmente (ej: solo 1 de 2 plus ones)
   ```

3. **Gestión de Invitaciones Digitales**
   - Sistema de plantillas personalizables
   - Generación automática de links únicos: `eventhub.app/i/{token}`
   - Preview antes de enviar
   - Scheduling de envíos (fecha/hora programada)
   - Tracking: abierto, click, respondido

4. **Notificaciones Automáticas**
   - Email al organizador cuando invitado confirma/rechaza
   - Webhook opcional para integraciones
   - Dashboard de actividad en tiempo real

5. **Filtros y Búsqueda**
   - Por estado RSVP
   - Por grupo/categoría
   - Por restricción alimenticia
   - Por mesa asignada
   - Búsqueda de texto completo

### 4.3 Gestión de Mesas (Feature Estrella)

**Vista Visual de Salón:**

```
Modo Drag & Drop Visual

┌────────────────────────────────────┐
│  Distribución de Mesas             │
│                                    │
│    [Mesa 1]      [Mesa 2]         │
│     6/8           8/8              │
│                                    │
│  [Mesa 3]  [Mesa 4]  [Mesa 5]     │
│    4/6      7/10      5/8          │
│                                    │
│           [Mesa VIP]               │
│             10/12                  │
│                                    │
└────────────────────────────────────┘

Sidebar:
- Invitados sin asignar (23)
- Conflictos detectados (2)
- Sugerencias (AI-powered)
```

**Funcionalidades:**

1. **Configuración de Mesas**
   - Añadir/eliminar mesas
   - Definir capacidad por mesa
   - Posicionamiento visual libre (x, y coordinates)
   - Etiquetas personalizadas (Mesa VIP, Mesa Familia, etc.)

2. **Asignación de Invitados**
   - Drag & drop desde lista de invitados a mesas
   - Asignación múltiple (seleccionar varios y asignar)
   - Vista de tarjeta por invitado mostrando info clave

3. **Sistema de Restricciones**
   - Marcar invitados que no deben estar juntos
   - Crear grupos que deben estar juntos (familia)
   - Validación en tiempo real de conflictos
   - Alertas visuales (mesa en rojo si hay conflicto)

4. **Sugerencias Automáticas (AI-Powered)**
   - Algoritmo que considera:
     - Grupos familiares/amigos
     - Edades similares
     - Restricciones definidas
     - Balanceo de mesas
   - Modo "Auto-distribute" con revisión manual

5. **Exportación**
   - Vista de impresión por mesa (seating charts)
   - PDF con layout visual
   - Lista por mesa para venue

### 4.4 Gestión de Preferencias Alimenticias

**Formulario por Invitado:**

```json
{
  "dietary_restrictions": {
    "is_vegetarian": boolean,
    "is_vegan": boolean,
    "is_gluten_free": boolean,
    "is_lactose_intolerant": boolean,
    "allergies": ["maní", "mariscos"],
    "other_notes": "texto libre"
  }
}
```

**Dashboard de Restricciones:**

```
Resumen Catering
├── Total invitados confirmados: 87
├── Vegetarianos: 12 (13.8%)
├── Veganos: 4 (4.6%)
├── Celíacos: 8 (9.2%)
├── Alergias declaradas: 15
│   ├── Mariscos: 7
│   ├── Frutos secos: 5
│   └── Lácteos: 3
└── Sin restricciones: 62 (71.3%)
```

**Reporte Exportable:**
- PDF estructurado por mesa
- CSV para catering con columnas: Mesa, Nombre, Restricciones
- Envío directo por email al proveedor

### 4.5 Sistema de Comunicación

**Tipos de Mensajes:**

1. **Invitación Inicial**
   - Template personalizable con branding
   - Variables dinámicas: {nombre}, {fecha}, {lugar}
   - Incluye link único de respuesta

2. **Recordatorios**
   - Recordatorio a pendientes (X días antes)
   - Recordatorio a confirmados (48hs antes del evento)
   - Scheduling automático o manual

3. **Anuncios**
   - Cambio de locación
   - Nuevo dato importante (ej: estacionamiento)
   - Broadcast a todos o grupos específicos

**Funcionalidades:**
- Editor WYSIWYG simple
- Preview mobile/desktop
- Envío por email y SMS (opcional, integración Twilio)
- Historial de comunicaciones enviadas
- Métricas: entregados, abiertos, clicks

### 4.6 Reportes y Analíticas

**Dashboard de Métricas:**

```
KPIs Principales
├── Tasa de confirmación: 72.5% (87/120)
├── Tiempo promedio de respuesta: 3.2 días
├── Plus ones confirmados: 23
├── Invitados sin mesa asignada: 5
└── Fotos subidas: 156

Gráficos
├── Timeline de confirmaciones (últimos 30 días)
├── Distribución por mesa (gráfico de barras)
├── Restricciones alimenticias (pie chart)
└── Engagement con invitaciones (funnel)
```

**Exportaciones:**
- Reporte completo (PDF): invitados, mesas, restricciones
- Lista de confirmados (CSV)
- Etiquetas para regalos/souvenirs (CSV)
- Tarjetas de mesa (PDF generado automáticamente)

### 4.7 Checklist Inteligente

**Tareas Auto-Generadas:**
- [ ] Subir lista de invitados
- [ ] Personalizar invitación
- [ ] Enviar invitaciones
- [ ] Configurar mesas
- [ ] Asignar invitados a mesas
- [ ] Exportar info para catering
- [ ] Enviar recordatorio 1 semana antes
- [ ] Habilitar galería de fotos
- [ ] Cerrar confirmaciones

**Progreso visual:** Barra de progreso general + categorías

### 4.8 Funcionalidades Adicionales Sugeridas

1. **Timeline del Evento**
   - Agregar momentos clave: ceremonia, cena, baile, torta
   - Compartir timeline con invitados
   - Notificaciones push en tiempo real durante evento

2. **Regalo/Registry Integration**
   - Link a lista de regalos externa
   - Tracking de quién envió regalo (opcional)

3. **Budget Tracker**
   - Presupuesto estimado vs real
   - Categorías: venue, catering, decoración, etc.
   - Alertas cuando se acerca al límite

4. **Vendor Management**
   - Lista de proveedores con contactos
   - Estado de contratación
   - Pagos pendientes/realizados

5. **Guest Check-in durante evento**
   - App móvil o tablet en entrada
   - Escaneo QR del invitado
   - Registro de asistencia real vs confirmada

6. **Encuestas Post-Evento**
   - Envío automático 24hs después
   - Recolección de feedback
   - Net Promoter Score

---

## 5. Funcionalidades del Invitado

### 5.1 Experiencia de Invitado

**Flujo de Usuario:**

```
1. Recibe email/SMS con link único
   ↓
2. Click en link → landing personalizada del evento
   ↓
3. Ve detalles: fecha, lugar, dress code, mensaje
   ↓
4. Confirma/Rechaza + llena preferencias
   ↓
5. Recibe confirmación
   ↓
6. Acceso continuo para ver detalles y subir fotos
```

**Página del Invitado:**

```
┌────────────────────────────────────────┐
│  Boda de María & Juan ❤️               │
├────────────────────────────────────────┤
│                                        │
│  📅 Sábado 15 de Mayo, 2026            │
│  🕐 20:00 hs                           │
│  📍 Estancia La Rural                  │
│      [Ver en Mapa]                     │
│                                        │
│  👔 Dress Code: Elegante Sport         │
│                                        │
│  💌 Mensaje de los novios:             │
│  "Queremos compartir este día tan..."  │
│                                        │
│  ✅ ¿Confirmas tu asistencia?          │
│  [ Sí, asistiré ]  [ No podré asistir]│
│                                        │
│  👤 ¿Venís con alguien? (max 1)        │
│  [ ] Traigo acompañante                │
│                                        │
│  🍽️ Preferencias alimenticias          │
│  [ ] Vegetariano [ ] Vegano [ ] Celíaco│
│  Alergias: _______________             │
│                                        │
│  [Confirmar]                           │
│                                        │
│  📸 Galería Colaborativa               │
│  [Subir Fotos] [Ver Galería]          │
│                                        │
└────────────────────────────────────────┘
```

### 5.2 Confirmación de Asistencia

**Formulario:**
- Radio buttons: Confirmo / No asistiré / Tal vez
- Si confirma:
  - Plus ones (si permitidos)
  - Nombres de acompañantes
  - Preferencias alimenticias (multi-checkbox + texto libre)
- Validación en tiempo real
- Guardado automático (draft)

**Post-Confirmación:**
- Mensaje de agradecimiento personalizado
- Agregar evento a calendario (iCal/Google Calendar)
- Recibo de confirmación por email

### 5.3 Mapa Interactivo

**Integración Google Maps:**
- Pin del venue con dirección exacta
- Botón "Cómo llegar" (abre Google/Waze/Apple Maps)
- Indicaciones de estacionamiento si las hay
- Vista previa del lugar (si el organizador carga fotos)

### 5.4 Portal de Fotos Colaborativo

**Arquitectura del Feature:**

```
Flujo de Subida:
Browser → Client-side compression → S3 Direct Upload → Lambda trigger → 
Thumbnail generation → Database update → Real-time notification
```

**Funcionalidades para Invitados:**

1. **Subida de Fotos**
   - Drag & drop multiple
   - Click para seleccionar (móvil: acceso a cámara)
   - Compresión automática client-side (reducción ~70% peso)
   - Progress bar por foto
   - Queue de subida (offline-first con retry)

2. **Límites:**
   - Max 20 fotos por invitado (configurable)
   - Max 10MB por foto antes de compresión
   - Formatos: JPG, PNG, HEIC

3. **Galería Compartida**
   - Vista de grid responsiva
   - Lazy loading
   - Filtro por invitado subidor (opcional)
   - Modo slideshow
   - Descarga individual

**Funcionalidades para Organizadores:**

1. **Moderación**
   - Todas las fotos pasan por "pending" primero
   - Interfaz de aprobación/rechazo rápida
   - Modo auto-aprobar (opcional, riesgoso)
   - Eliminación masiva

2. **Descarga Masiva**
   - Botón "Descargar todas" genera ZIP en background
   - Notificación cuando está listo (webhook o polling)
   - Link temporal de descarga (expires en 24hs)

3. **Almacenamiento**
   - Dashboard de uso: X MB / Y MB límite del plan
   - Alerta al 80% de uso
   - Opción de comprar storage adicional

**Arquitectura Técnica Recomendada:**

```
Storage: S3-compatible (AWS S3, Cloudflare R2, Backblaze B2)

Estructura de paths:
/{tenant_id}/{event_id}/photos/
  /original/{photo_id}.jpg
  /thumbnail/{photo_id}_thumb.jpg

Compresión:
- Client-side: Browser-image-compression library
- Server-side: Sharp (Node.js) o Pillow (Python)
- Thumbnails: 300px width, quality 80

CDN: Cloudflare/CloudFront para servir imágenes

Costos estimados (100 invitados, 15 fotos c/u):
- Storage: ~5GB → $0.12/mes (S3 Standard)
- Transfer: ~10GB/mes → $0.90/mes
- Total: <$2/mes por evento
```

**Optimizaciones:**

1. **Compresión Agresiva:**
   - Original: 4MB → comprimido: 800KB
   - Thumbnail: 50KB
   - Ahorro: 75-80%

2. **Lifecycle Policies:**
   - Después de 90 días → Glacier (storage frío)
   - Después de 2 años → solicitar eliminación o archivado

3. **Lazy Loading:**
   - Intersection Observer API
   - Cargar solo imágenes visibles en viewport
   - Progresive image loading (blur → full)

---

## 6. Stack Tecnológico Recomendado

### 6.1 Frontend

**Framework: Next.js 14+ (App Router)**

Razones:
- SSR/SSG para SEO y performance
- API routes integradas
- Excelente DX y ecosistema
- Vercel deploy optimizado

**UI Library:**
- React 18+ con Server Components
- TypeScript estricto
- Tailwind CSS para styling
- shadcn/ui para componentes base
- Radix UI primitivos para accesibilidad

**Estado:**
- Zustand o Jotai para estado global ligero
- React Query (TanStack Query) para server state
- React Hook Form para formularios

**Drag & Drop:**
- dnd-kit (más moderno que react-beautiful-dnd)
- @hello-pangea/dnd como alternativa

**Maps:**
- @vis.gl/react-google-maps (oficial Google)
- Leaflet + OpenStreetMap como alternativa open source

**Charts:**
- Recharts o Chart.js
- Tremor para dashboards analytics

### 6.2 Backend

**Opción A: Node.js (Recomendado para startup)**

```
Framework: Fastify o Express.js
ORM: Prisma (type-safe, migrations, multi-DB)
Validación: Zod
Autenticación: JWT + Passport.js o NextAuth
Task Queue: BullMQ + Redis
Email: Resend o SendGrid
SMS: Twilio
```

**Opción B: Python**

```
Framework: FastAPI
ORM: SQLAlchemy 2.0 + Alembic
Validación: Pydantic
Autenticación: FastAPI-Users
Task Queue: Celery + Redis
Email: SendGrid
```

Recomendación: **Node.js** por coherencia con frontend y facilidad para compartir tipos TypeScript.

### 6.3 Base de Datos

**Primary Database: PostgreSQL**

Razones:
- Relacional con soporte JSON (híbrido)
- Excelente para multi-tenancy (schemas o row-level)
- ACID compliant
- Escalable verticalmente y horizontalmente
- Compatible con múltiples hosts (Supabase, Neon, Railway)

**Estrategia Multi-Tenant:**

```sql
-- Opción 1: Shared schema con tenant_id (RECOMENDADO para MVP)
CREATE TABLE events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255),
  ...
);
CREATE INDEX idx_events_tenant ON events(tenant_id);

-- Row Level Security (RLS) en PostgreSQL
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON events
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Opción 2: Schema per tenant (escalabilidad futura)
-- Cada tenant tiene su propio schema: tenant_abc, tenant_xyz
```

**Cache Layer: Redis**

Usos:
- Session storage
- Rate limiting
- Queue de emails/notificaciones
- Cache de queries frecuentes (guest lists, metrics)

### 6.4 Infraestructura

**Hosting:**

```
Frontend: Vercel
- Deploy automático desde Git
- Edge network global
- Serverless functions incluidas
- $0 para MVP (<100GB bandwidth)

Backend: Railway o Fly.io
- Deploy desde Dockerfile
- PostgreSQL incluido
- Auto-scaling
- ~$5-20/mes para MVP

Database: Neon o Supabase
- PostgreSQL serverless
- Branching para desarrollo
- Autoscaling
- Free tier generoso

Storage: Cloudflare R2
- S3-compatible
- Sin egress fees (vs S3)
- $0.015/GB/mes (vs $0.023 S3)
- CDN gratis integrado
```

**Alternativa económica total: Supabase + Vercel**
- Supabase: DB + Auth + Storage + Edge Functions
- Vercel: Frontend + API Routes
- Costo: $0-25/mes para MVP

### 6.5 Autenticación y Autorización

**Sistema de Auth:**

```typescript
// Tokens por rol

// Organizador: JWT standard
{
  userId: "uuid",
  tenantId: "uuid",
  role: "owner" | "organizer" | "collaborator",
  eventIds: ["uuid1", "uuid2"], // eventos con acceso
  permissions: ["guests:write", "tables:write", ...]
}

// Invitado: Token único por evento
{
  guestId: "uuid",
  eventId: "uuid",
  token: "random-secure-token",
  expiresAt: "2026-12-31"
}
```

**Flujo:**

1. **Organizador:** Email/Password → JWT → Cookie httpOnly
2. **Invitado:** Link mágico → Cookie con guest token → No password

**Seguridad:**
- Bcrypt para passwords (cost factor 12)
- Rate limiting: 5 login attempts / 15min
- CSRF protection
- SameSite cookies
- HTTPS only en producción

### 6.6 Email y Notificaciones

**Proveedor: Resend (recomendado)**

Razones:
- API simple
- Templates con React (react-email)
- Delivery rate alto
- Free tier: 100 emails/día
- $20/mes → 50k emails

```typescript
// Ejemplo envío invitación
import { Resend } from 'resend';
import { InvitationEmail } from '@/emails/invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'EventHub <invitations@eventhub.app>',
  to: guest.email,
  subject: `Invitación: ${event.name}`,
  react: InvitationEmail({ 
    guestName: guest.name,
    eventName: event.name,
    invitationLink: `https://app.eventhub.com/i/${guest.token}`
  })
});
```

**SMS (Opcional):**
- Twilio para recordatorios críticos
- Solo para plan premium
- Costo: ~$0.01 USD por SMS

---

## 7. Diseño UX/UI

### 7.1 Principios de Diseño

1. **Mobile First:** 70% de invitados accederán desde móvil
2. **Progressive Disclosure:** Mostrar solo lo necesario en cada paso
3. **Feedback Inmediato:** Confirmaciones visuales para cada acción
4. **Error Prevention:** Validación inline, confirmaciones para acciones destructivas
5. **Accesibilidad:** WCAG 2.1 AA compliance mínimo

### 7.2 Dashboard Modular

**Estructura:**

```
┌─────────────────────────────────────────┐
│  Header: Logo | Event Selector | User   │
├────────┬────────────────────────────────┤
│        │                                │
│ Sidebar│  Main Content Area             │
│        │  (cambia según sección)        │
│ - Home │                                │
│ - Guests│                               │
│ - Tables│                               │
│ - Comm │                                │
│ - Photos│                               │
│ - Reports│                              │
│        │                                │
└────────┴────────────────────────────────┘
```

**Navegación:**
- Sidebar colapsable en mobile (hamburger menu)
- Breadcrumbs en contextos profundos
- Quick actions flotantes (FAB en mobile)

### 7.3 Componentes Clave

**Vista de Mesas (Drag & Drop):**
- Canvas HTML5 o SVG
- Zoom in/out
- Grid snapping opcional
- Undo/Redo
- Auto-save cada 2 segundos

**Lista de Invitados:**
- Virtual scrolling para listas grandes (react-window)
- Acciones bulk (selección múltiple + acción)
- Filtros sticky en top
- Skeleton loaders durante fetch

**Formularios:**
- Validación inline (on blur)
- Estados: default, focus, error, success, disabled
- Helper text descriptivo
- Auto-save drafts en formularios largos

### 7.4 Mobile Experience

**Invitado:**
- Single column layout
- Botones grandes (min 44x44px)
- Bottom navigation si múltiples secciones
- Swipe gestures para galería

**Organizador:**
- Tabs horizontales scrollables
- Bottom sheet para acciones secundarias
- Pull to refresh en listas
- Modo lectura simplificado para estadísticas

### 7.5 Temas y Branding

**Tema del Sistema:**
- Light/Dark mode automático (prefers-color-scheme)
- Toggle manual
- Persiste en localStorage

**Customización por Evento:**
- Color primario personalizable
- Logo del evento (opcional)
- Fondo de invitación
- Solo en plan premium

---

## 8. Modelo de Negocio

### 8.1 Planes de Suscripción

**FREE (Freemium)**
- 1 evento activo simultáneo
- Hasta 50 invitados
- Gestión básica (invitados, confirmaciones)
- Sin distribución de mesas
- 500MB storage fotos
- Branding EventHub visible
- Email support
- **Conversión esperada:** 15-20% a pago después de primer evento

**PRO ($49 USD/evento)**
- Evento ilimitados
- Hasta 200 invitados
- Distribución visual de mesas
- Sugerencias AI de distribución
- 5GB storage fotos
- Comunicaciones ilimitadas
- Reportes exportables
- Branding customizable
- Email + Chat support

**ENTERPRISE ($199 USD/evento o custom)**
- Invitados ilimitados
- Multi-evento con dashboard consolidado
- 50GB storage
- White-label completo
- API access
- Prioridad en soporte
- Account manager dedicado
- SLA 99.9% uptime

### 8.2 Add-ons (Upsells)

- **Storage Extra:** $5/10GB adicionales
- **SMS Notifications:** $10/100 SMS
- **Custom Domain:** $15/mes (ej: eventos.miempresa.com)
- **Advanced Analytics:** $20/mes (heatmaps, funnel analysis)
- **Priority Support:** $50/mes

### 8.3 Fuentes de Monetización Adicionales

1. **Comisiones de Registry:**
   - Integración con Amazon/Mercado Libre wishlist
   - 2-5% comisión en compras referidas

2. **Marketplace de Vendors:**
   - Listado de catering, fotógrafos, lugares
   - Fee por lead o % de contratación

3. **Plantillas Premium:**
   - Templates de invitación diseñados
   - $5-15 por template

4. **Post-Event Services:**
   - Álbum impreso con fotos del evento
   - Video highlights automatizado con AI
   - $50-200 dependiendo del producto

### 8.4 Costos Operativos Estimados

**Por evento (100 invitados, plan PRO):**

```
Infraestructura:
- Hosting backend: $0.50
- Database: $0.30
- Storage (5GB fotos): $0.15
- CDN bandwidth: $0.20
- Email (200 envíos): $0.10

Total COGS: $1.25
Margen bruto: $47.75 (97.5%)
```

**Fijos mensuales (startup):**
- Hosting: $50
- Herramientas (analytics, monitoring): $100
- Email marketing (Mailchimp): $50
- Dominio + SSL: $15
- **Total: ~$215/mes**

### 8.5 Proyecciones

**Escenario conservador Año 1:**
- 100 eventos/mes (mix Free + Pro)
- 30% conversión a Pro
- Revenue: $1,470/mes → $17,640/año
- Costos: $215/mes fijo + $37.50 variables → $302.50/mes → $3,630/año
- **Profit: $14,010 (79% margin)**

**Escenario optimista Año 2:**
- 500 eventos/mes
- 40% conversión Pro, 5% Enterprise
- Revenue: $11,450/mes → $137,400/año
- Costos: $500/mes fijo + $625 variables → $13,500/año
- **Profit: $123,900 (90% margin)**

---

## 9. Roadmap: MVP vs Futuro

### 9.1 MVP (Versión 1.0) - 3 meses

**Objetivo:** Producto mínimo viable para validar hipótesis con early adopters.

**Alcance:**

✅ **Auth y Multi-tenancy**
- Registro de organizadores
- Login/logout
- Tenant isolation básico

✅ **Gestión de Invitados**
- CRUD manual de invitados
- Estados: pending, confirmed, declined
- Exportación CSV básica

✅ **Invitaciones**
- Generación de links únicos
- Template simple de email
- Página de respuesta de invitado
- Confirmación con preferencias alimenticias

✅ **Página del Invitado**
- Vista de detalles del evento
- Formulario de confirmación
- Mapa de ubicación (Google Maps embed)

✅ **Dashboard Básico**
- Métricas: total, confirmados, pendientes
- Lista de invitados con filtros simples

✅ **Portal de Fotos Colaborativo**
- Subida de fotos por invitados
- Galería compartida
- Descarga individual
- Storage en S3/R2

🚫 **NO incluye en MVP:**
- Distribución de mesas
- Comunicaciones masivas
- Importación CSV
- Reportes complejos
- Branding customizable
- Multi-idioma

**Stack MVP:**
- Frontend: Next.js + Tailwind + shadcn/ui
- Backend: Next.js API Routes (monolith)
- DB: Supabase PostgreSQL
- Storage: Cloudflare R2
- Email: Resend
- Deploy: Vercel

**Métricas de Éxito MVP:**
- 50 eventos creados en 3 meses
- 20% tasa de conversión Free → Pro
- NPS > 40
- <5% churn

### 9.2 Versión 2.0 - 6 meses

**Features:**

✅ **Distribución de Mesas**
- Canvas drag & drop
- Asignación visual
- Restricciones básicas
- Exportación PDF seating chart

✅ **Comunicaciones**
- Envío de invitaciones masivas
- Recordatorios automáticos
- Templates personalizables

✅ **Importación de Datos**
- CSV import con validación
- Mapeo de columnas flexible

✅ **Reportes Avanzados**
- Dashboard de analíticas
- Exportación PDF completo
- Gráficos de engagement

✅ **Moderación de Fotos**
- Workflow de aprobación
- Descarga masiva (ZIP)
- Límites por plan

### 9.3 Versión 3.0 - 12 meses

**Features Avanzados:**

✅ **AI-Powered Suggestions**
- Auto-distribución de mesas inteligente
- Predicción de tasa de confirmación
- Recomendaciones de timing óptimo

✅ **Mobile App** (React Native / Flutter)
- Check-in en tiempo real durante evento
- Notificaciones push
- Modo offline

✅ **Integraciones**
- Zapier/Make
- Google Calendar sync
- CRM (HubSpot, Salesforce)
- Payment gateways (Stripe, MercadoPago)

✅ **Marketplace**
- Vendors verificados
- Sistema de reviews
- Booking directo

✅ **Multi-idioma**
- Español, Inglés, Portugués
- Auto-detección por región

### 9.4 Futuro (18+ meses)

**Expansión:**

- **Eventos Corporativos:** Features B2B (badges, networking, agenda)
- **Eventos Virtuales/Híbridos:** Streaming, virtual booths
- **White-label Platform:** Vender la plataforma a otras empresas
- **API Pública:** Permitir integraciones custom
- **Video Invitations:** Generación de videos con AI
- **Blockchain Tickets:** NFT tickets para exclusividad

---

## 10. Consideraciones Técnicas Críticas

### 10.1 Escalabilidad

**Database Scaling:**

```
Proyección de crecimiento:
- Año 1: 1,000 eventos → 100k invitados → 200k photos
- Año 3: 10,000 eventos → 1M invitados → 2M photos

Estrategia:
1. Indexación agresiva (tenant_id, event_id, created_at)
2. Particionamiento por fecha (events, photos)
3. Read replicas para queries pesadas
4. Cache layer (Redis) para hot data
5. Archive old events (>2 años) a storage frío
```

**Application Scaling:**

```
Horizontally scalable arquitecture:
- Stateless API servers (auto-scale en Railway/K8s)
- Shared-nothing excepto DB y Redis
- CDN para assets estáticos
- Background jobs en queue (BullMQ)
```

### 10.2 Performance

**Optimizaciones:**

1. **Frontend:**
   - Code splitting por ruta
   - Image optimization (next/image)
   - Lazy loading components
   - Service Worker para assets

2. **Backend:**
   - Connection pooling (PgBouncer)
   - Query optimization (EXPLAIN ANALYZE)
   - Batch operations donde sea posible
   - Compression (gzip/brotli)

3. **Database:**
   - Índices compuestos estratégicos
   - Materialized views para reportes
   - VACUUM y ANALYZE automático
   - N+1 query prevention (Prisma/DataLoader)

**Target Metrics:**
- Time to Interactive: <3s
- First Contentful Paint: <1.5s
- API response p95: <200ms
- Photo upload: <5s (imagen 3MB)

### 10.3 Seguridad

**Checklist:**

✅ **Autenticación:**
- Password hashing (bcrypt)
- JWT con expiración corta (15min)
- Refresh tokens en httpOnly cookies
- Rate limiting en login (5 intentos/15min)

✅ **Autorización:**
- Row-level security (RLS)
- Validación tenant_id en cada query
- Principle of least privilege

✅ **Data:**
- Encryption at rest (DB level)
- Encryption in transit (TLS 1.3)
- PII handling según GDPR/CCPA
- Soft deletes (paranoid mode)

✅ **Infrastructure:**
- WAF (Cloudflare)
- DDoS protection
- Regular security audits
- Dependency scanning (Snyk/Dependabot)

✅ **Uploads:**
- File type validation (magic numbers, no solo extension)
- Virus scanning (ClamAV)
- Size limits strict
- Isolated storage (no executable permissions)

### 10.4 Monitoreo y Observabilidad

**Stack:**
- **Logs:** Papertrail o Better Stack
- **Metrics:** Prometheus + Grafana (self-hosted) o Datadog
- **APM:** Sentry para error tracking
- **Uptime:** Uptime Robot o Better Uptime
- **RUM:** Vercel Analytics o PostHog

**Alertas:**
- Error rate >1%
- API latency p95 >500ms
- DB connections >80%
- Disk usage >85%
- Failed email delivery >10%

### 10.5 Backup y Disaster Recovery

**Estrategia:**

```
Database:
- Automated daily backups (retención 30 días)
- Point-in-time recovery (PITR) habilitado
- Weekly backup tests
- Multi-region replication (producción)

Storage (Photos):
- S3 versioning habilitado
- Cross-region replication
- Lifecycle policy: archive a Glacier después 2 años

Recovery Time Objective (RTO): <4 horas
Recovery Point Objective (RPO): <1 hora
```

---

## 11. Estrategia de Go-to-Market

### 11.1 Target Audience

**Primary:**
- Organizadores profesionales de eventos (20-45 años)
- Planners freelance especializados en eventos sociales
- Empresas de catering con servicio de organización

**Secondary:**
- Padres organizando eventos de hijos (15 años, graduaciones)
- Parejas organizando su propia boda
- Coordinadores de eventos corporativos pequeños

### 11.2 Canales de Adquisición

**Orgánico:**
- SEO: "herramienta organizar boda", "software gestión eventos"
- Content marketing: Blog con guías prácticas
- Referrals: 20% descuento por referido

**Paid:**
- Google Ads: Search campaigns (low CPC nicho específico)
- Instagram/Facebook: Ads a organizadores
- Partnership con venues

**Partnerships:**
- Venues: Co-marketing, ellos recomiendan, comisión 10%
- Catering: Integración directa de menús
- Wedding planners: Plan white-label

### 11.3 Pricing Strategy

**Psicología:**
- Free plan como lead magnet
- $49 punto sweet spot (< $50 = micro-decisión)
- Anchor pricing: mostrar Enterprise ($199) hace que Pro parezca barato

**Promociones de Lanzamiento:**
- Early bird: 50% off primeros 100 clientes
- Lifetime deal: $299 pago único (limited)
- Referral program: Mes gratis por cada 3 referidos

---

## 12. Métricas Clave (KPIs)

### 12.1 Product Metrics

- **Activation Rate:** % de usuarios que completan setup del primer evento
- **Feature Adoption:**
  - % usando distribución de mesas
  - % con >10 fotos subidas
  - % enviando comunicaciones
- **Guest Engagement:**
  - % de invitados que confirman en <48hs
  - Average photos per guest
  - RSVP completion rate

### 12.2 Business Metrics

- **MRR (Monthly Recurring Revenue)**
- **Churn Rate:** <5% target
- **CAC (Customer Acquisition Cost):** <$30
- **LTV (Lifetime Value):** >$150 (3+ eventos promedio)
- **LTV:CAC Ratio:** >3:1
- **Conversion Rate Free→Pro:** >15%

### 12.3 Technical Metrics

- **Uptime:** 99.5% target (MVP), 99.9% (producción)
- **API Latency p95:** <200ms
- **Error Rate:** <0.5%
- **Photo Upload Success Rate:** >95%

---

## 13. Riesgos y Mitigaciones

### 13.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Costos storage explotan | Media | Alto | Límites estrictos, compresión agresiva, lifecycle policies |
| Escalabilidad DB prematura | Baja | Alto | Architecture review antes de 1000 eventos, sharding plan |
| Pérdida de datos (fotos) | Baja | Crítico | Backups automáticos, replicación multi-región |
| Bots/spam en fotos | Media | Medio | CAPTCHA, rate limiting, moderación |

### 13.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Competencia con feature copia | Alta | Medio | Moat en UX y network effects, iteración rápida |
| Estacionalidad eventos | Alta | Medio | Diversificar a eventos corporativos |
| Baja conversión free→paid | Media | Alto | Onboarding mejorado, value demos, trials |
| Dependencia de un canal | Media | Alto | Multi-channel marketing desde día 1 |

### 13.3 Riesgos Legales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| GDPR/CCPA compliance | Media | Alto | Privacy by design, legal review, DPO |
| Copyright en fotos | Baja | Medio | ToS claros, DMCA process |
| Abuso de plataforma | Baja | Medio | Content moderation, reporting tools |

---

## 14. Próximos Pasos

### 14.1 Pre-Development

- [ ] Validación con 10 organizadores de eventos (user interviews)
- [ ] Mockups de alta fidelidad (Figma)
- [ ] Definición de schema de DB final
- [ ] Setup de infraestructura (GitHub, Vercel, Railway)

### 14.2 Desarrollo MVP (Sprint Planning)

**Sprint 1-2 (Weeks 1-4):**
- Auth system
- Multi-tenant foundation
- DB schema y migrations
- Basic CRUD invitados

**Sprint 3-4 (Weeks 5-8):**
- Invitaciones digitales
- Página del invitado
- Confirmación flow
- Email integration

**Sprint 5-6 (Weeks 9-12):**
- Portal de fotos
- S3 integration
- Dashboard organizador
- Testing y bug fixes

### 14.3 Launch

- [ ] Beta privado con 20 early adopters
- [ ] Iterar según feedback
- [ ] Launch público
- [ ] Product Hunt launch
- [ ] Partnerships con 3 venues

---

## 15. Apéndices

### 15.1 Glosario

- **Tenant:** Organización o cuenta cliente dentro del sistema SaaS
- **RSVP:** Répondez s'il vous plaît - confirmación de asistencia
- **Plus One:** Acompañante adicional de un invitado
- **Seating Chart:** Distribución visual de mesas y asientos
- **Drag & Drop:** Interacción de arrastrar y soltar elementos

### 15.2 Referencias

- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- [SaaS Metrics Guide](https://www.forentrepreneurs.com/saas-metrics-2/)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

### 15.3 Recursos de Diseño

- Figma Community: Event Management Templates
- shadcn/ui Components Library
- Tailwind UI: Application Layouts
- Dribbble: Event Dashboard Inspiration

---

## Conclusión

Este PRD define EventHub como una plataforma SaaS escalable y moderna para la gestión de eventos sociales. El enfoque en multi-tenancy, la experiencia del invitado, y el portal de fotos colaborativo diferencia el producto en un mercado fragmentado.

**El MVP se centra en demostrar valor core** (gestión de invitados + confirmaciones + fotos) con una arquitectura que permite escalar gradualmente hacia features avanzados como distribución de mesas e integraciones.

**Next Action:** Validar hipótesis con 10 user interviews antes de iniciar desarrollo.

---

**Documento preparado para:** Equipo de desarrollo  
**Autor:** Product Requirements Analysis  
**Última actualización:** Febrero 2026  
**Versión:** 1.0