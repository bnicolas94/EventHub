'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

import { checkPlanLimits } from '@/lib/plans';
import { verifyFeatureAccess } from '@/lib/gating';

export async function uploadPhoto(formData: FormData) {
    // 0. Fetch Tenant for limiting
    const supabase = await createServiceRoleClient();
    const eventId = formData.get('eventId') as string;

    const { data: event } = await supabase
        .from('events')
        .select('tenant_id, settings')
        .eq('id', eventId)
        .single();

    if (!event) return { success: false, error: 'Evento no encontrado' };

    const limitCheck = await checkPlanLimits(event.tenant_id, 'storage');
    if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.message };
    }

    const file = formData.get('file') as File;
    const guestId = formData.get('guestId') as string;
    const caption = formData.get('caption') as string || '';

    if (!file) {
        return { success: false, error: 'Falta el archivo' };
    }

    const moderationEnabled = event.settings?.moderation_enabled || false;
    const initialStatus = moderationEnabled ? 'pending' : 'approved';

    // 1. Validar Tipo de Archivo y Extensión
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
        return { success: false, error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP y HEIC.' };
    }

    // Validar MIME type básico
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'El archivo debe ser una imagen.' };
    }

    // 2. Upload to Storage
    const fileName = `${eventId}/${uuidv4()}.${fileExt}`;

    // ... (bucket check omitted for brevity in diff, but keep existing logic if not touching it)
    // Actually, let's keep the bucket check logic intact, just inserting the check before.

    // Check if bucket exists, create if not (robust fallback)
    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
            console.error('List Buckets Error:', listError);
        } else if (!buckets?.find(b => b.name === 'event-photos')) {
            console.log('Bucket not found, attempting to create...');
            const { data: bucket, error: createError } = await supabase.storage.createBucket('event-photos', {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 5242880 // 5MB
            });
            if (createError) {
                console.error('Create Bucket Error:', createError);
                return { success: false, error: `Error creating bucket: ${createError.message}` };
            }
            console.log('Bucket created successfully:', bucket);
        }
    } catch (e) {
        console.error('Unexpected error checking/creating bucket:', e);
    }

    const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Storage upload error detail:', JSON.stringify(uploadError, null, 2));
        return { success: false, error: `Error storage: ${uploadError.message}` };
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(fileName);

    // 3. Insert into Database
    const { error: dbError } = await supabase
        .from('photos')
        .insert({
            // Foreign Keys
            event_id: eventId,
            guest_id: guestId || null,
            uploaded_by_guest_id: guestId || null,

            // File Info
            file_path: fileName,
            url: publicUrl,

            // Metadata
            caption: caption,

            // Statuses (populate both for safety)
            status: initialStatus,
            moderation_status: initialStatus
        });

    if (dbError) {
        console.error('DB insert error detail:', JSON.stringify(dbError, null, 2));
        return { success: false, error: 'Error al guardar la referencia de la foto' };
    }

    revalidatePath(`/rsvp`); // Revalidate all RSVPs or specifically the token one if we had it, but this is safe enough for now.
    return { success: true };
}

export async function deletePhoto(photoId: string, photoUrl: string) {
    const supabase = await createServerSupabaseClient();

    // 1. Check permissions (Organizer only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // Ideally verify user owns the event associated with the photo, but RLS handles delete on table
    // However, storage delete requires explicit check or policy.
    // We'll trust the RLS on the table to prevent unauthorized deletes of the row,
    // and then clean up storage.

    // 2. Delete from DB
    const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

    if (dbError) {
        return { success: false, error: dbError.message };
    }

    // 3. Delete from Storage
    // Extract path from URL
    const path = photoUrl.split('/event-photos/')[1];
    if (path) {
        await supabase.storage
            .from('event-photos')
            .remove([path]);
    }

    return { success: true };
}

export async function updatePhotoStatus(photoId: string, status: 'approved' | 'rejected') {
    const supabase = await createServerSupabaseClient();

    // 1. Check permissions (Organizer only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const hasAccess = await verifyFeatureAccess('photo_moderation');
    if (!hasAccess) {
        return { success: false, error: 'Tu plan actual no incluye la moderación de fotos.' };
    }

    // 2. Update DB
    const { error } = await supabase
        .from('photos')
        .update({
            status: status,
            moderation_status: status
        })
        .eq('id', photoId);

    if (error) {
        console.error('Error updating photo status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/events`);
    return { success: true };
}
