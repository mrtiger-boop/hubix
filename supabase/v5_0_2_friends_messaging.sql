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

alter table friend_requests enable row level security;
alter table friends enable row level security;

drop policy if exists "friend requests involved read" on friend_requests;
create policy "friend requests involved read" on friend_requests
for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friend requests own insert" on friend_requests;
create policy "friend requests own insert" on friend_requests
for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "friend requests involved update" on friend_requests;
create policy "friend requests involved update" on friend_requests
for update to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friends own all" on friends;
create policy "friends own all" on friends
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

delete from matches
where id not in (
  select min(id::text)::uuid
  from matches
  group by least(user_a::text, user_b::text), greatest(user_a::text, user_b::text)
);

create unique index if not exists unique_match_pair
on matches (
  least(user_a::text, user_b::text),
  greatest(user_a::text, user_b::text)
);
