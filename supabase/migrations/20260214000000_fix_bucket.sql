-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure public read access (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'event-photos' );
    END IF;
END
$$;
