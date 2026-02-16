-- Create photos table
CREATE TYPE photo_status AS ENUM ('approved', 'pending', 'rejected');

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    caption TEXT,
    status photo_status DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Policies for photos table
-- 1. Public Read (anyone with link can see approved photos)
CREATE POLICY "Public can view approved photos" 
ON public.photos FOR SELECT 
USING (status = 'approved');

-- 2. Guests can upload (we will use a server action with service role for this to be safer initially, 
-- but decent practice to have a policy if we switch to client upload later. 
-- For now, let's allow insert if you have a valid guest session - but since we don't have DB-level auth for guests, 
-- we largely rely on Server Actions. However, let's allow Authenticated users (organizers) to do everything via RLS)

CREATE POLICY "Organizers can do everything on their event photos"
ON public.photos FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM public.events WHERE id = event_id
    )
);

-- Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-photos' );

-- 2. Upload access (We'll handle specific auth checks in the server action, but we need a policy to allow inserts)
-- Since guests aren't technically "authenticated" in Supabase Auth (they are just anonymous with a guest ID),
-- we will largely rely on the Service Role / Server Actions for the actual upload to bypass RLS limits for guests.
-- But for the Organizer, we need clear access.
CREATE POLICY "Organizers can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'event-photos' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Organizers can delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'event-photos' AND
    auth.role() = 'authenticated'
);
