-- ============================================================================
-- 008_SECURITY_PATCHES — EventHub
-- Corregir vulnerabilidades críticas de aislamiento de tenants y storage.
-- ============================================================================

BEGIN;

-- 1. CORRECCIÓN: Aislamiento Cross-Tenant en 'guests'
-- Eliminar política insegura anterior
DROP POLICY IF EXISTS "Authenticated users can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Users can view own tenant guests" ON public.guests;
DROP POLICY IF EXISTS "Users can insert own tenant guests" ON public.guests;
DROP POLICY IF EXISTS "Users can update own tenant guests" ON public.guests;
DROP POLICY IF EXISTS "Users can delete own tenant guests" ON public.guests;

-- Nueva política única y segura para organizadores sobre sus propios invitados
CREATE POLICY "Organizers manage own tenant guests" ON public.guests 
  FOR ALL 
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      INNER JOIN public.users u ON e.tenant_id = u.tenant_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 2. CORRECCIÓN: Aislamiento Cross-Tenant en 'tables'
-- Eliminar política insegura anterior
DROP POLICY IF EXISTS "Authenticated users can manage tables" ON public.tables;

-- Nueva política única y segura para organizadores sobre sus propias mesas
CREATE POLICY "Organizers manage own tenant tables" ON public.tables
  FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      INNER JOIN public.users u ON e.tenant_id = u.tenant_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 3. CORRECCIÓN: Referencia de columna rota en 'photos'
-- Eliminar política fallida
DROP POLICY IF EXISTS "Organizers can do everything on their event photos" ON public.photos;

-- Nueva política corregida para la tabla photos
CREATE POLICY "Organizers manage own event photos" ON public.photos
  FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      INNER JOIN public.users u ON e.tenant_id = u.tenant_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 4. CORRECCIÓN: Seguridad de Storage (Aislamiento de Archivos)
-- Eliminar políticas genéricas previas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete" ON storage.objects;

-- 4.1. Permitir lectura pública solo para el bucket 'event-photos' (o según lógica de negocio)
CREATE POLICY "Public Read Event Photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-photos' );

-- 4.2. Restringir INSERT/UPDATE/DELETE a organizadores solo en su propia carpeta (eventId)
-- El path esperado es 'eventId/photoId.ext'
CREATE POLICY "Organizers manage own event storage"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'event-photos' AND
    (
      -- El primer segmento del path debe ser un eventId del tenant del usuario
      (storage.foldername(name))[1]::uuid IN (
        SELECT e.id FROM public.events e
        INNER JOIN public.users u ON e.tenant_id = u.tenant_id
        WHERE u.auth_id = auth.uid()
      )
    )
);

COMMIT;
