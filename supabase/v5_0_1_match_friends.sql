alter table matches add column if not exists compatibility int default 85;
alter table matches add column if not exists active boolean default true;

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

create table if not exists friends (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, friend_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text default '',
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table friend_requests enable row level security;
alter table friends enable row level security;
alter table notifications enable row level security;

drop policy if exists "friend requests involved read" on friend_requests;
create policy "friend requests involved read" on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friend requests own insert" on friend_requests;
create policy "friend requests own insert" on friend_requests for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "friend requests involved update" on friend_requests;
create policy "friend requests involved update" on friend_requests for update to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friends own all" on friends;
create policy "friends own all" on friends for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications own read" on notifications;
create policy "notifications own read" on notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications own insert" on notifications;
create policy "notifications own insert" on notifications for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "notifications own update" on notifications;
create policy "notifications own update" on notifications for update to authenticated using (auth.uid() = user_id);
