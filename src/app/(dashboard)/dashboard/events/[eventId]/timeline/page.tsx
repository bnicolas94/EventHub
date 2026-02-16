
import { getTimeline } from '@/app/actions/timeline';
import { TimelineManager } from '@/components/timeline/timeline-manager';
import { TimelineItem } from '@/types/timeline.types';

export default async function TimelinePage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const items = await getTimeline(eventId) as TimelineItem[];

    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <TimelineManager eventId={eventId} initialItems={items} />
        </div>
    );
}
