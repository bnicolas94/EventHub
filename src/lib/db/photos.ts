import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export interface GetEventPhotosFilters {
    eventId: string;
    page?: number;
    limit?: number;
    status?: 'approved' | 'pending' | 'rejected' | null;
}

export async function getEventPhotos({ eventId, page = 1, limit = 20, status = 'approved' }: GetEventPhotosFilters) {
    // Use Service Role to bypass RLS for reading public photos (safer to just enforce filter here)
    const supabase = await createServiceRoleClient();
    const offset = (page - 1) * limit;

    let query = supabase
        .from('photos')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)
        .order('uploaded_at', { ascending: false, nullsFirst: false }) // Use uploaded_at as per migration 001
        .range(offset, offset + limit - 1);

    // Apply status filter only if explicitly requested, but for now let's try fetching ALL to debug
    if (status) {
        // Filter by both columns for robustness during migration
        query = query.or(`status.eq.${status},moderation_status.eq.${status}`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching photos:', JSON.stringify(error, null, 2));
        return { success: false, error: 'No se pudieron cargar las fotos' };
    }

    // Transform data to ensure URL is present
    const enrichedData = data?.map(photo => {
        let finalUrl = photo.url;
        if (!finalUrl && photo.file_path) {
            const { data: publicUrlData } = supabase.storage
                .from('event-photos')
                .getPublicUrl(photo.file_path);
            finalUrl = publicUrlData.publicUrl;
        }
        return {
            ...photo,
            url: finalUrl
        };
    });

    return {
        success: true,
        data: enrichedData,
        metadata: {
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };
}
