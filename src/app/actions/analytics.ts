'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
    totalGuests: number;
    confirmedGuests: number;
    pendingGuests: number;
    declinedGuests: number;
    confirmationRate: number;
    avgResponseTimeDays: number; // Placeholder for now
    plusOnesConfirmed: number;
    guestsWithoutTable: number;
    totalPhotos: number;
    dietaryStats: { name: string; value: number; fill: string }[];
    timelineData: { date: string; confirmed: number; declined: number }[];
}

export async function getEventAnalytics(eventId: string): Promise<{ data?: DashboardMetrics; error?: string }> {
    const supabase = await createServerSupabaseClient();

    try {
        // 1. Fetch Guests
        const { data: guests, error: guestsError } = await supabase
            .from('guests')
            .select('*')
            .eq('event_id', eventId);

        if (guestsError) throw guestsError;

        // 2. Fetch Photos
        const { count: photoCount, error: photosError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        if (photosError) throw photosError;

        // 3. Calculate KPIs
        const totalGuests = guests?.length || 0;
        const confirmedGuests = guests?.filter(g => g.rsvp_status === 'confirmed').length || 0;
        const pendingGuests = guests?.filter(g => g.rsvp_status === 'pending').length || 0;
        const declinedGuests = guests?.filter(g => g.rsvp_status === 'declined').length || 0;

        const confirmationRate = totalGuests > 0
            ? Math.round((confirmedGuests / totalGuests) * 100)
            : 0;

        const plusOnesConfirmed = guests?.reduce((acc, curr) => acc + (curr.plus_ones_confirmed || 0), 0) || 0;

        // Guests confirmed but without table assignment
        const guestsWithoutTable = guests?.filter(g =>
            g.rsvp_status === 'confirmed' && !g.table_assignment_id
        ).length || 0;

        // 4. Calculate Dietary Stats
        let veg = 0, vegan = 0, celiac = 0, lactose = 0, other = 0, none = 0;

        guests?.forEach(g => {
            if (g.rsvp_status !== 'confirmed') return;

            // Check JSON structure: dietary_restrictions
            const diet = g.dietary_restrictions as any;
            if (!diet) {
                none++;
                return;
            }

            let hasRestriction = false;
            if (diet.is_vegetarian) { veg++; hasRestriction = true; }
            if (diet.is_vegan) { vegan++; hasRestriction = true; }
            if (diet.is_gluten_free) { celiac++; hasRestriction = true; }
            if (diet.is_lactose_intolerant) { lactose++; hasRestriction = true; }
            if (diet.allergies && Array.isArray(diet.allergies) && diet.allergies.length > 0) { other++; hasRestriction = true; }
            if (diet.other_notes) { other++; hasRestriction = true; } // Count notes as 'other/restriction' too? Maybe simplify.

            if (!hasRestriction) none++;
        });

        // Format for PieChart (Recharts)
        const dietaryStats = [
            { name: 'Sin restricciones', value: none, fill: '#94a3b8' }, // slate-400
            { name: 'Vegetariano', value: veg, fill: '#4ade80' }, // green-400
            { name: 'Vegano', value: vegan, fill: '#22c55e' }, // green-500
            { name: 'Celíaco (TACC)', value: celiac, fill: '#facc15' }, // yellow-400
            { name: 'Intolerante Lactosa', value: lactose, fill: '#fbbf24' }, // amber-400
            { name: 'Alergias/Otros', value: other, fill: '#f87171' }, // red-400
        ].filter(item => item.value > 0);


        // 5. Calculate Timeline Data (Real aggregation)
        // Group by date (YYYY-MM-DD) and calculate cumulative sum
        const timelineMap = new Map<string, { confirmed: number, declined: number }>();

        // 5a. Populate map with daily changes
        guests?.forEach(g => {
            if (g.rsvp_status !== 'confirmed' && g.rsvp_status !== 'declined') return;

            // Use responded_at if available, otherwise created_at
            const dateStr = (g.responded_at || g.created_at || new Date().toISOString()).split('T')[0];

            if (!timelineMap.has(dateStr)) {
                timelineMap.set(dateStr, { confirmed: 0, declined: 0 });
            }

            const entry = timelineMap.get(dateStr)!;
            if (g.rsvp_status === 'confirmed') entry.confirmed++;
            if (g.rsvp_status === 'declined') entry.declined++;
        });

        // 5b. Sort dates and verify we have at least start and end points
        let sortedDates = Array.from(timelineMap.keys()).sort();

        if (sortedDates.length === 0) {
            // If no data, add today
            const today = new Date().toISOString().split('T')[0];
            sortedDates = [today];
            timelineMap.set(today, { confirmed: 0, declined: 0 });
        }

        // 5c. simple cumulative sum
        const timelineData: { date: string; confirmed: number; declined: number }[] = [];
        let runningConfirmed = 0;
        let runningDeclined = 0;

        sortedDates.forEach(date => {
            const dayStats = timelineMap.get(date)!;
            runningConfirmed += dayStats.confirmed;
            runningDeclined += dayStats.declined;

            timelineData.push({
                date,
                confirmed: runningConfirmed,
                declined: runningDeclined
            });
        });


        return {
            data: {
                totalGuests,
                confirmedGuests,
                pendingGuests,
                declinedGuests,
                confirmationRate,
                avgResponseTimeDays: 3.2, // Mocked until we track response times
                plusOnesConfirmed,
                guestsWithoutTable,
                totalPhotos: photoCount || 0,
                dietaryStats,
                timelineData
            }
        };

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return { error: error.message };
    }
}
