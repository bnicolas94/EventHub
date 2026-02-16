'use client';

import { create } from 'zustand';
import type { User, Tenant, Event, SubscriptionPlan } from '@/lib/types';

interface AuthState {
    user: User | null;
    tenant: Tenant | null;
    isSystemAdmin: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setTenant: (tenant: Tenant | null) => void;
    setIsSystemAdmin: (isAdmin: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    tenant: null,
    isSystemAdmin: false,
    isLoading: true,
    setUser: (user) => set({ user }),
    setTenant: (tenant) => set({ tenant }),
    setIsSystemAdmin: (isSystemAdmin) => set({ isSystemAdmin }),
    setIsLoading: (isLoading) => set({ isLoading }),
    reset: () => set({ user: null, tenant: null, isSystemAdmin: false, isLoading: false }),
}));

interface EventState {
    currentEvent: Event | null;
    events: Event[];
    setCurrentEvent: (event: Event | null) => void;
    setEvents: (events: Event[]) => void;
}

export const useEventStore = create<EventState>((set) => ({
    currentEvent: null,
    events: [],
    setCurrentEvent: (currentEvent) => set({ currentEvent }),
    setEvents: (events) => set({ events }),
}));
