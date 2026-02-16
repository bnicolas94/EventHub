# Documento Técnico de Entrega - Portal de Fotos Colaborativo
**Fecha:** 14 de Febrero de 2026
**Estado:** Funcional (Production Ready for MVP) + Panel Moderación
**Feature:** Subida de fotos colaborativa para invitados en RSVP + Moderación.

Este documento detalla todas las implementaciones, correcciones de base de datos, y lógica clave realizada para habilitar el portal de fotos. Se debe usar como referencia para continuar el desarrollo.

## 1. Arquitectura & Base de Datos

### Almacenamiento (Supabase Storage)
- **Bucket:** `event-photos`
- **Permisos:** Público para lectura, restringido para escritura (RLS requiere autenticación, pero usamos Service Role para invitados).
- **Auto-creación:** Se implementó lógica en `uploadPhoto` para crear el bucket si no existe.

### Base de Datos (Tabla `photos`)
La tabla `photos` existente tenía un esquema antiguo (`file_path`, `uploaded_at`), y añadimos columnas nuevas (`url`, `caption`, `status`) sin borrar las viejas.
**Estructura Híbrida Actual (Soportada por el código):**
- `id`: UUID (PK)
- `event_id`: UUID (FK -> events)
- `file_path`: TEXT (Original, NOT NULL) -> Se guarda la ruta `eventId/filename`.
- `url`: TEXT (Nueva) -> Se guarda la URL pública completa.
- `uploaded_by_guest_id`: UUID (Original) -> Se guarda el ID del invitado.
- `guest_id`: UUID (Nueva, redundante) -> Se guarda el ID del invitado (para compatibilidad futura).
- `moderation_status`: VARCHAR (Original) -> `approved` por defecto.
- `status`: ENUM (Nueva) -> `approved` por defecto.
- `caption`: TEXT (Nueva).
- `uploaded_at`: TIMESTAMPTZ (Original).

**Nota Importante:** El código actual rellena TANTO las columnas viejas como las nuevas para asegurar que funcione sin importar qué versión de la tabla tenga el entorno.

### Seguridad (RLS Policies)
Se configuraron políticas RLS, pero para evitar problemas con invitados no autenticados (que usan token), **se utiliza `createServiceRoleClient` tanto para subir como para leer fotos**.
- **Lectura:** Se filtra manualmente por `.eq('status', 'approved')` en el backend.
- **Escritura:** El Server Action valida el ID del evento y del invitado antes de subir.

## 2. Componentes Clave

### `src/app/actions/photos.ts` (Server Action)
- **Función `uploadPhoto`**:
  1.  Recibe `FormData` (archivo, eventId, guestId, caption).
  2.  Verifica/Crea el bucket `event-photos`.
  3.  Sube el archivo a Storage.
  4.  Inserta en BD rellenando **todos** los campos (viejos y nuevos) para evitar errores de restricción `NOT NULL`.
  5.  Revalida el path `/rsvp`.
- **Función `updatePhotoStatus`**:
  - Cambia estado de moderación (updates both `status` and `moderation_status`).

### `src/lib/db/photos.ts` (Data Access Layer)
- **Función `getEventPhotos`**:
  1.  Usa Service Role para evitar bloqueos RLS.
  2.  Ejecuta Query ordenando por `uploaded_at`.
  3.  **Transformación Inteligente:** Si el campo `url` viene vacío de la DB, genera dinámicamente la URL pública usando `supabase.storage.getPublicUrl(file_path)`. Esto arregla fotos viejas o migradas incorrectamente.
  4.  Soporta filtro `status: null` para traer TODAS las fotos (moderación).

### `src/components/photos/photo-upload.tsx` (Cliente)
- Implementa **subida masiva** (Batch Upload).
- Comprime imágenes en el cliente antes de subir (usando `browser-image-compression`).
- Muestra progreso real (ej. "Subiendo 3/5").

### `src/components/photos/photo-moderation-grid.tsx`
- Grid administrativo para aprobar/rechazar fotos.
- Dialog de detalle con acciones.

### `next.config.ts`
- Se añadió configuración de imágenes para permitir dominios externos de Supabase:
```typescript
images: {
    remotePatterns: [
        { protocol: 'https', hostname: '**.supabase.co' },
        ...
    ]
}
```

## 3. Estado Actual de la Página RSVP (`src/app/rsvp/[token]/page.tsx`)
- Se ha **REACTIVADO** el componente `RSVPViewerWrapper` (Visualizador de Invitación).
- La página muestra:
  1.  Invitación Digital (Fabric.js).
  2.  Tabs: Confirmar Asistencia / Galería de Fotos.
  3.  Galería funcionando con Masonry Layout.
  4.  Botón flotante de cámara para subir fotos.

## 4. Pasos para Continuar (Next Steps)
1.  **Limpieza de Base de Datos (Opcional):** Crear una migración formal para unificar columnas (ej. migrar `file_path` a `url` y borrar viejas), pero el código actual es robusto.
2.  **Mobile Optimization:** Verificar que el Fabric.js cargue rápido en móviles (lazy load).

**Comandos para reanudar:**
- `npm run dev`

