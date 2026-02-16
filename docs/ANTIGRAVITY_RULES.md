# Reglas Globales - EventHub SaaS Platform

## Información del Proyecto

**Nombre:** EventHub  
**Tipo:** Aplicación web SaaS multi-tenant  
**Propósito:** Plataforma de gestión de eventos sociales (bodas, 15 años, aniversarios, eventos corporativos pequeños)  
**Versión objetivo:** MVP 1.0  
**Documento de referencia:** PRD-EventHub.md

---

## 1. Stack Tecnológico Obligatorio

### Frontend
```
- Framework: Next.js 14+ (App Router)
- Lenguaje: TypeScript (strict mode)
- Styling: Tailwind CSS
- Componentes: shadcn/ui + Radix UI
- Estado global: Zustand
- Server state: TanStack Query (React Query)
- Formularios: React Hook Form + Zod
- Drag & Drop: dnd-kit
- Maps: @vis.gl/react-google-maps
```

### Backend
```
- Runtime: Node.js 20+
- Framework: Next.js API Routes (para MVP)
- Validación: Zod
- ORM: Prisma
- Autenticación: NextAuth.js
- Task Queue: BullMQ + Redis
- Email: Resend con react-email
```

### Base de Datos
```
- Primary DB: PostgreSQL 15+
- Cache: Redis 7+
- ORM: Prisma con migrations
- Multi-tenancy: Row-level con tenant_id + RLS policies
```

### Infraestructura
```
- Frontend hosting: Vercel
- Backend hosting: Railway o Fly.io
- Database: Supabase o Neon
- Storage: Cloudflare R2 (S3-compatible)
- CDN: Cloudflare
```

---

## 2. Arquitectura y Patrones

### 2.1 Estructura de Carpetas

```
eventhub/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes group
│   │   ├── (dashboard)/         # Dashboard routes group
│   │   ├── i/[token]/           # Guest invitation page
│   │   ├── api/                 # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── dashboard/           # Dashboard específicos
│   │   ├── guest/               # Guest view específicos
│   │   └── shared/              # Compartidos
│   ├── lib/
│   │   ├── auth/                # Auth utilities
│   │   ├── db/                  # Prisma client + queries
│   │   ├── email/               # Email templates
│   │   ├── storage/             # S3/R2 utilities
│   │   ├── validators/          # Zod schemas
│   │   └── utils.ts
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript types
│   └── config/                  # Configuration files
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
└── tests/
```

### 2.2 Convenciones de Nomenclatura

**Archivos:**
- Componentes React: `PascalCase.tsx` (ej: `GuestList.tsx`)
- Utilities: `camelCase.ts` (ej: `formatDate.ts`)
- API routes: `kebab-case/route.ts`
- Tipos: `PascalCase.types.ts` o `.d.ts`

**Variables y funciones:**
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Funciones: `camelCase`
- React components: `PascalCase`
- Hooks: `use` prefix (ej: `useGuests`)
- Context: `Provider` suffix (ej: `AuthProvider`)

**Database:**
- Tablas: `snake_case` plural (ej: `events`, `guests`)
- Columnas: `snake_case` (ej: `created_at`, `tenant_id`)
- Foreign keys: `{table}_id` (ej: `event_id`, `guest_id`)

---

## 3. Principios de Desarrollo

### 3.1 Arquitectura Multi-Tenant

**CRÍTICO - Toda query debe incluir tenant_id:**

```typescript
// ❌ INCORRECTO
const events = await prisma.event.findMany();

// ✅ CORRECTO
const events = await prisma.event.findMany({
  where: { tenant_id: currentUser.tenantId }
});
```

**Middleware obligatorio:**
```typescript
// Validar tenant_id en cada request API
export async function validateTenant(req: Request) {
  const session = await getSession(req);
  if (!session?.user?.tenantId) {
    throw new UnauthorizedError();
  }
  return session.user.tenantId;
}
```

**Row-Level Security (RLS):**
```sql
-- Aplicar en PostgreSQL para defensa en profundidad
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON events
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 3.2 Seguridad

**Autenticación:**
- Passwords: bcrypt con cost factor 12 mínimo
- JWT tokens: 15 minutos de expiración
- Refresh tokens: httpOnly cookies, SameSite=Strict
- Rate limiting: 5 login attempts por 15 minutos
- Guest tokens: UUID v4 único, expiración configurable

**Validación de Inputs:**
```typescript
// SIEMPRE validar con Zod antes de procesar
import { z } from 'zod';

const createGuestSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  event_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

// En API route
export async function POST(req: Request) {
  const body = await req.json();
  const validated = createGuestSchema.parse(body); // Throws si falla
  // ... procesar
}
```

**Uploads de archivos:**
- Validar magic numbers, NO solo extensión
- Límites estrictos: max 10MB por imagen
- Sanitizar nombres de archivo
- Virus scanning si es posible (ClamAV)
- Nunca ejecutar archivos subidos

### 3.3 Performance

**Queries a DB:**
```typescript
// ✅ Usar select para limitar campos
const guests = await prisma.guest.findMany({
  where: { event_id: eventId },
  select: {
    id: true,
    full_name: true,
    email: true,
    rsvp_status: true,
    // NO traer campos innecesarios
  }
});

// ✅ Usar include estratégicamente
const event = await prisma.event.findUnique({
  where: { id: eventId },
  include: {
    guests: {
      where: { rsvp_status: 'confirmed' },
      select: { id: true, full_name: true }
    }
  }
});

// ✅ Evitar N+1 queries - usar include/nested queries
```

**Indexación:**
```prisma
// En schema.prisma - índices obligatorios
model Guest {
  id            String   @id @default(uuid())
  event_id      String
  tenant_id     String
  
  @@index([event_id])
  @@index([tenant_id])
  @@index([event_id, rsvp_status])
  @@index([invitation_token])
}
```

**Caching:**
- Redis para session storage
- Cache de queries frecuentes (guest counts, metrics)
- TTL apropiado: 5min para datos dinámicos, 1hr para estáticos
- Invalidar cache al mutar data

**Frontend:**
- Code splitting por ruta (automático en Next.js)
- Lazy loading de componentes pesados
- Virtual scrolling para listas >100 items (react-window)
- Optimistic updates con React Query
- Image optimization con next/image

### 3.4 Manejo de Errores

**Tipos de errores personalizados:**
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}
```

**Error boundaries:**
```typescript
// components/ErrorBoundary.tsx
// Implementar en cada ruta principal
```

**API error responses:**
```typescript
// Formato estándar
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email inválido",
    "details": { field: "email", value: "..." }
  }
}
```

---

## 4. Reglas de Código

### 4.1 TypeScript

**Configuración estricta obligatoria:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Prohibido:**
- `any` (usar `unknown` si es necesario)
- `@ts-ignore` (usar `@ts-expect-error` con comentario)
- Type assertions sin justificación
- Optional chaining excesivo (indica mal diseño)

**Tipos compartidos:**
```typescript
// types/guest.types.ts
export type RsvpStatus = 'pending' | 'confirmed' | 'declined' | 'tentative';

export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  rsvp_status: RsvpStatus;
  created_at: Date;
}

export type CreateGuestInput = Omit<Guest, 'id' | 'created_at'>;
export type UpdateGuestInput = Partial<CreateGuestInput>;
```

### 4.2 React Components

**Estructura de componente:**
```typescript
'use client'; // Solo si necesita interactividad

import { useState } from 'react';
import { type ComponentProps } from './types';

// Props interface siempre explícita
interface GuestCardProps {
  guest: Guest;
  onUpdate: (id: string, data: UpdateGuestInput) => Promise<void>;
  className?: string;
}

// Componente con tipos explícitos
export function GuestCard({ guest, onUpdate, className }: GuestCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Handlers
  const handleSave = async () => {
    await onUpdate(guest.id, { /* ... */ });
    setIsEditing(false);
  };
  
  // Early returns para casos especiales
  if (!guest) return null;
  
  // JSX
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      {/* ... */}
    </div>
  );
}
```

**Reglas:**
- Un componente por archivo (excepto subcomponentes privados pequeños)
- Props destructuring en signature
- Named exports (no default exports)
- Custom hooks para lógica reutilizable
- Memoización solo cuando hay evidencia de problema de performance

### 4.3 Server Components vs Client Components

**Por defecto: Server Components**

```typescript
// app/dashboard/events/page.tsx
// Server Component - NO 'use client'
import { getEvents } from '@/lib/db/events';

export default async function EventsPage() {
  const events = await getEvents(); // Fetch directo en server
  
  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

**Client Component solo cuando:**
- Necesita hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, etc.)
- Third-party libraries que requieren client

```typescript
// components/GuestForm.tsx
'use client'; // Necesita useState y onSubmit

import { useState } from 'react';

export function GuestForm() {
  const [name, setName] = useState('');
  // ...
}
```

### 4.4 Prisma Queries

**Patrón recomendado - Query functions en lib/db:**

```typescript
// lib/db/guests.ts
import { prisma } from './client';
import { type RsvpStatus } from '@/types';

export async function getEventGuests(
  eventId: string,
  tenantId: string,
  filters?: {
    rsvpStatus?: RsvpStatus;
    searchTerm?: string;
  }
) {
  return prisma.guest.findMany({
    where: {
      event_id: eventId,
      tenant_id: tenantId,
      ...(filters?.rsvpStatus && { rsvp_status: filters.rsvpStatus }),
      ...(filters?.searchTerm && {
        OR: [
          { full_name: { contains: filters.searchTerm, mode: 'insensitive' } },
          { email: { contains: filters.searchTerm, mode: 'insensitive' } },
        ]
      }),
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function createGuest(
  data: CreateGuestInput,
  tenantId: string
) {
  return prisma.guest.create({
    data: {
      ...data,
      tenant_id: tenantId,
      invitation_token: generateSecureToken(),
    }
  });
}
```

**Transacciones para operaciones múltiples:**
```typescript
export async function assignGuestsToTable(
  guestIds: string[],
  tableId: string,
  tenantId: string
) {
  await prisma.$transaction([
    prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
        tenant_id: tenantId,
      },
      data: { table_assignment_id: tableId }
    }),
    prisma.table.update({
      where: { id: tableId },
      data: { updated_at: new Date() }
    })
  ]);
}
```

---

## 5. Storage de Imágenes

### 5.1 Arquitectura

**Estructura de paths S3/R2:**
```
bucket: eventhub-photos
├── {tenant_id}/
│   ├── {event_id}/
│   │   ├── original/
│   │   │   ├── {photo_id}.jpg
│   │   │   └── ...
│   │   └── thumbnail/
│   │       ├── {photo_id}_thumb.jpg
│   │       └── ...
```

**Nomenclatura:**
- Photo ID: UUID v4
- Formato: JPEG (convertir PNG/HEIC a JPG)
- Thumbnail: `{photo_id}_thumb.jpg`

### 5.2 Upload Flow

```typescript
// 1. Frontend - Compresión client-side
import imageCompression from 'browser-image-compression';

async function handleImageUpload(file: File) {
  // Comprimir antes de subir
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  
  // 2. Request presigned URL
  const { uploadUrl, photoId } = await fetch('/api/photos/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: compressed.type,
    })
  }).then(r => r.json());
  
  // 3. Upload directo a R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': compressed.type }
  });
  
  // 4. Confirmar upload
  await fetch('/api/photos/confirm', {
    method: 'POST',
    body: JSON.stringify({ photoId })
  });
}
```

**Backend - Generación de presigned URLs:**
```typescript
// app/api/photos/upload-url/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: Request) {
  const session = await auth();
  const { filename, contentType } = await req.json();
  
  const photoId = crypto.randomUUID();
  const key = `${session.tenantId}/${eventId}/original/${photoId}.jpg`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  
  return Response.json({ uploadUrl, photoId });
}
```

### 5.3 Procesamiento de Thumbnails

**Lambda/Background job trigger:**
```typescript
// Procesar con Sharp
import sharp from 'sharp';

export async function generateThumbnail(photoKey: string) {
  const original = await downloadFromR2(photoKey);
  
  const thumbnail = await sharp(original)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
  
  const thumbKey = photoKey.replace('/original/', '/thumbnail/').replace('.jpg', '_thumb.jpg');
  await uploadToR2(thumbKey, thumbnail);
  
  // Update DB
  await prisma.photo.update({
    where: { file_path: photoKey },
    data: { thumbnail_path: thumbKey }
  });
}
```

### 5.4 Límites y Quotas

```typescript
// Validación antes de upload
async function validatePhotoUpload(guestId: string, eventId: string) {
  // Límite por invitado
  const guestPhotos = await prisma.photo.count({
    where: {
      uploaded_by_guest_id: guestId,
      event_id: eventId,
    }
  });
  
  if (guestPhotos >= 20) {
    throw new ValidationError('Límite de 20 fotos alcanzado');
  }
  
  // Límite por evento (según plan)
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tenant: true }
  });
  
  const totalSize = await getTotalStorageUsed(event.tenant_id);
  if (totalSize >= event.tenant.storage_quota_mb * 1024 * 1024) {
    throw new ValidationError('Cuota de almacenamiento excedida');
  }
}
```

---

## 6. Testing

### 6.1 Estrategia

**Cobertura mínima:**
- Unit tests: utilities, validators, business logic
- Integration tests: API routes críticos
- E2E tests: flujos principales (signup, create event, RSVP)

**NO sobre-testear:**
- Componentes UI simples (presentacionales)
- Configuración y setup
- Third-party integrations (mockear)

### 6.2 Testing Stack

```
- Framework: Vitest (más rápido que Jest)
- React testing: @testing-library/react
- E2E: Playwright
- API testing: supertest o Vitest con MSW
```

### 6.3 Ejemplos

**Unit test - Validator:**
```typescript
// lib/validators/guest.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from './guest';

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

**Integration test - API route:**
```typescript
// app/api/guests/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';

describe('POST /api/guests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  it('should create guest with valid data', async () => {
    const req = new Request('http://localhost/api/guests', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Test User',
        email: 'test@example.com',
        event_id: 'valid-uuid',
      })
    });
    
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
```

---

## 7. Deployment y CI/CD

### 7.1 Ambientes

```
- Development: Local + Supabase/Railway dev instance
- Staging: Vercel preview + Railway staging
- Production: Vercel + Railway production
```

### 7.2 Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
  
  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
```

### 7.3 Migrations

**NUNCA rollback migrations en producción - siempre forward-only:**

```bash
# Desarrollo
npx prisma migrate dev --name add_guest_phone

# Staging/Production
npx prisma migrate deploy
```

**Checklist antes de deploy:**
- [ ] Tests passing
- [ ] Migrations probadas en staging
- [ ] Backup de DB tomado
- [ ] Variables de entorno actualizadas
- [ ] Monitoring activo

---

## 8. Monitoreo y Logging

### 8.1 Logging

**Librería: pino (structured logging)**

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Uso
logger.info({ userId, eventId }, 'Event created');
logger.error({ err, guestId }, 'Failed to send invitation');
```

**Logs obligatorios:**
- Errores (con stack trace)
- Autenticación (login, logout, failed attempts)
- Acciones críticas (delete event, bulk operations)
- Performance (slow queries >500ms)

### 8.2 Métricas

**Key metrics a trackear:**

```typescript
// Usar @opentelemetry o similar
metrics.recordCounter('api.requests', { endpoint, status });
metrics.recordHistogram('api.duration', duration, { endpoint });
metrics.recordGauge('db.connections', pool.activeConnections);
```

**Alertas configuradas:**
- Error rate >1% por 5min
- API p95 latency >500ms
- DB connections >80%
- Failed email delivery >10%

### 8.3 Herramientas

```
- Logs: Better Stack o Papertrail
- Errors: Sentry
- APM: Vercel Analytics + Railway metrics
- Uptime: Better Uptime
```

---

## 9. Documentación

### 9.1 Código

**JSDoc para funciones públicas:**
```typescript
/**
 * Crea un nuevo invitado y envía la invitación por email
 * 
 * @param data - Datos del invitado a crear
 * @param tenantId - ID del tenant (multi-tenancy)
 * @returns Promise con el invitado creado
 * @throws {ValidationError} Si los datos son inválidos
 * @throws {ForbiddenError} Si se excede el límite de invitados
 */
export async function createGuest(
  data: CreateGuestInput,
  tenantId: string
): Promise<Guest> {
  // ...
}
```

### 9.2 API Documentation

**Mantener OpenAPI spec actualizado:**

```yaml
# openapi.yaml
paths:
  /api/guests:
    post:
      summary: Crear invitado
      tags: [Guests]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateGuestInput'
      responses:
        201:
          description: Invitado creado
        400:
          description: Validación fallida
```

### 9.3 README

**Estructura mínima del README:**
```markdown
# EventHub

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Installation
1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env`
4. `npx prisma migrate dev`
5. `npm run dev`

## Architecture
- [Link a PRD]
- [Link a diagrams]

## Development
- `npm run dev` - Start dev server
- `npm run test` - Run tests
- `npm run lint` - Lint code
```

---

## 10. Reglas de Git

### 10.1 Branching Strategy

```
main (production)
├── staging (auto-deploy to staging)
└── feature/* (feature branches)
└── fix/* (bug fix branches)
```

**Flujo:**
1. Create feature branch from `main`
2. Develop + commit
3. PR to `staging` → auto-deploy
4. Test in staging
5. PR from `staging` to `main` → production deploy

### 10.2 Commits

**Formato: Conventional Commits**

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: Nueva feature
- `fix`: Bug fix
- `refactor`: Refactoring sin cambio funcional
- `docs`: Documentación
- `test`: Tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```
feat(guests): add CSV import functionality

- Parse CSV with papaparse
- Validate rows
- Bulk insert with transaction

Closes #123
```

```
fix(auth): prevent session hijacking

Add SameSite=Strict to cookies
```

### 10.3 Pull Requests

**Template obligatorio:**

```markdown
## Qué cambios incluye este PR?
[Descripción breve]

## Por qué es necesario?
[Contexto/problema que resuelve]

## Cómo testearlo?
1. ...
2. ...

## Checklist
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Sin warnings de TypeScript
- [ ] Migrations incluidas (si aplica)
- [ ] Probado en staging
```

**Reglas:**
- Mínimo 1 approval antes de merge
- CI debe pasar
- Squash commits al mergear a `main`
- Delete branch después de merge

---

## 11. Variables de Entorno

### 11.1 Estructura

```bash
# .env.example (commitear este)
# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_DIRECT="postgresql://..." # Para migrations

# Redis
REDIS_URL="redis://..."

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand"
NEXTAUTH_URL="http://localhost:3000"

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="eventhub-photos"
R2_PUBLIC_URL="https://photos.eventhub.app"

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="EventHub <noreply@eventhub.app>"

# External APIs
GOOGLE_MAPS_API_KEY=""

# Monitoring
SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

# Feature Flags (opcional)
FEATURE_TABLE_DISTRIBUTION="true"
FEATURE_AI_SUGGESTIONS="false"
```

### 11.2 Validación en runtime

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().startsWith('re_'),
  // ... otros
});

export const env = envSchema.parse(process.env);
```

---

## 12. Límites y Constraints

### 12.1 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// API endpoints
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
});

// Auth endpoints
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts/15min
});

// Photo uploads
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 uploads/hour por guest
});
```

### 12.2 Resource Limits

**Por Plan:**

```typescript
export const PLAN_LIMITS = {
  free: {
    events: 1,
    guests_per_event: 50,
    storage_mb: 500,
    photos_per_guest: 10,
  },
  pro: {
    events: Infinity,
    guests_per_event: 200,
    storage_mb: 5000,
    photos_per_guest: 20,
  },
  enterprise: {
    events: Infinity,
    guests_per_event: Infinity,
    storage_mb: 50000,
    photos_per_guest: 50,
  },
} as const;
```

**Validación:**
```typescript
async function validateEventCreation(tenantId: string) {
  const tenant = await getTenant(tenantId);
  const activeEvents = await countActiveEvents(tenantId);
  
  const limit = PLAN_LIMITS[tenant.plan].events;
  if (activeEvents >= limit) {
    throw new ForbiddenError(
      `Límite de eventos alcanzado. Upgrade tu plan para crear más.`
    );
  }
}
```

---

## 13. Consideraciones Finales

### 13.1 Prohibiciones

**NUNCA:**
- Hardcodear credenciales
- Commitear `.env` (solo `.env.example`)
- Usar `console.log` en producción (usar logger)
- Exponer IDs internos en URLs públicas (usar UUIDs)
- Permitir SQL injection (usar Prisma/parametrized queries)
- Guardar passwords en plain text
- Ejecutar queries sin tenant_id (multi-tenancy)
- Confiar en inputs del usuario sin validar

### 13.2 Best Practices

**SIEMPRE:**
- Validar inputs con Zod
- Sanitizar outputs (XSS prevention)
- Usar prepared statements / ORM
- Implementar CSRF protection
- Rate limit endpoints públicos
- Log errores con contexto suficiente
- Escribir tests para lógica crítica
- Documentar decisiones arquitectónicas importantes
- Hacer code review antes de mergear
- Mantener dependencias actualizadas

### 13.3 Performance Targets

**Métricas objetivo:**

```
Frontend:
- Lighthouse Score: >90
- Time to Interactive: <3s
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s

Backend:
- API response p50: <100ms
- API response p95: <200ms
- API response p99: <500ms

Database:
- Query execution p95: <50ms
- Connection time: <10ms

Uptime:
- MVP: 99.5%
- Production: 99.9%
```

---


## 14. Recursos y Referencias

### Documentación Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

### Guías y Patterns
- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- [Next.js App Router Best Practices](https://nextjs.org/docs/app/building-your-application)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Herramientas
- [Prisma Studio](https://www.prisma.io/studio) - DB GUI
- [Postman](https://www.postman.com/) - API testing
- [Excalidraw](https://excalidraw.com/) - Diagramas

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo EventHub

---

## Notas de Implementación

Este documento debe ser el **punto de referencia único** para todas las decisiones técnicas del proyecto. Antigravity debe:

1. **Seguir estrictamente** las reglas de multi-tenancy (validación tenant_id)
2. **Priorizar** TypeScript strict mode y validación con Zod
3. **Implementar** el stack definido sin desviaciones
4. **Respetar** la estructura de carpetas y nomenclatura
5. **Aplicar** los patrones de seguridad obligatorios
6. **Cumplir** los performance targets definidos
7. **Idioma** español

Si surge necesidad de desviarse de estas reglas, debe ser documentado y justificado en el PR correspondiente.

**¡Éxitos con el desarrollo de EventHub! 🚀**