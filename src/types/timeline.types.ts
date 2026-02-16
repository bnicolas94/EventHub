
export interface TimelineItem {
    id: string;
    event_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time?: string | null;
    icon: string;
    order: number;
    created_at: string;
}

export type CreateTimelineItemInput = Omit<TimelineItem, 'id' | 'created_at' | 'event_id'>;
export type UpdateTimelineItemInput = Partial<CreateTimelineItemInput>;
