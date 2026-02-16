
create table if not exists event_timeline_items (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  icon text default 'clock',
  "order" integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table event_timeline_items enable row level security;

-- Policies

-- Allow read for authenticated users who own the event
create policy "Users can view timeline items for their events"
  on event_timeline_items for select
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timeline_items.event_id
      and events.tenant_id = (select tenant_id from users where auth_id = auth.uid())
    )
  );

-- Allow write for authenticated users who own the event
create policy "Users can insert timeline items for their events"
  on event_timeline_items for insert
  to authenticated
  with check (
    exists (
      select 1 from events
      where events.id = event_timeline_items.event_id
      and events.tenant_id = (select tenant_id from users where auth_id = auth.uid())
    )
  );

create policy "Users can update timeline items for their events"
  on event_timeline_items for update
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timeline_items.event_id
      and events.tenant_id = (select tenant_id from users where auth_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_timeline_items.event_id
      and events.tenant_id = (select tenant_id from users where auth_id = auth.uid())
    )
  );

create policy "Users can delete timeline items for their events"
  on event_timeline_items for delete
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timeline_items.event_id
      and events.tenant_id = (select tenant_id from users where auth_id = auth.uid())
    )
  );
