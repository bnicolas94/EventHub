'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getActiveEvent } from '@/app/actions/events';
import { getGuests } from '@/app/actions/guests';
import { getChecklist } from '@/app/actions/checklist';

import { ChecklistItem } from './checklist';

export interface DashboardMetrics {
    totalGuests: number;
    confirmedGuests: number;
    pendingGuests: number;
    declinedGuests: number;
    daysLeft: number;
    eventName: string;
    recentActivity: GuestActivity[];
    checklistProgress: number;
    checklistItems: ChecklistItem[];
    eventId: string;
}

export interface GuestActivity {
    id: string;
    guestName: string;
    status: string;
    updatedAt: string;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
    noStore(); // Prevent caching
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Get User's Tenant
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        console.error('Dashboard Error: Tenant not found for user', user.id);
        return null;
    }

    // 2. Get Active/Latest Event
    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        // No error, just empty state if no event exists
        return null;
    }

    // 3. Get Guest Stats
    const guests = await getGuests(event.id);
    const guestsError = null; // getGuests handles errors and returns []

    const totalGuests = guests?.length || 0;
    const confirmedGuests = guests?.filter((g: any) => g.rsvp_status === 'confirmed').length || 0;
    const declinedGuests = guests?.filter((g: any) => g.rsvp_status === 'declined').length || 0;
    const pendingGuests = totalGuests - confirmedGuests - declinedGuests;

    // 4. Calculate Days Left
    const eventDate = event.date ? new Date(event.date) : new Date();
    const today = new Date();
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // 5. Recent Activity (Last 5 updates)
    const recentActivity = guests
        ?.slice(0, 5)
        .map((g: any) => ({
            id: g.id,
            guestName: g.full_name,
            status: g.rsvp_status,
            updatedAt: g.created_at // guests table uses created_at
        })) || [];

    // 6. Checklist Progress
    const checklistItems = await getChecklist(event.id);
    const totalTasks = checklistItems.length;
    const completedTasks = checklistItems.filter(t => t.is_completed).length;

    const checklistProgress = (totalTasks && totalTasks > 0)
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return {
        totalGuests,
        confirmedGuests,
        pendingGuests,
        declinedGuests,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        eventName: event.name,
        recentActivity,
        checklistProgress,
        checklistItems,
        eventId: event.id
    };
}
