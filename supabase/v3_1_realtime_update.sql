create extension if not exists "pgcrypto";

create table if not exists private_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists friends (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, friend_id)
);

create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  favorite_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, favorite_id)
);

create table if not exists blocks (
  user_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, blocked_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade,
  reported_id uuid references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

alter table private_messages enable row level security;
alter table friends enable row level security;
alter table favorites enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;

drop policy if exists "private read participants" on private_messages;
create policy "private read participants" on private_messages for select using (
  exists (
    select 1 from matches
    where matches.id = private_messages.match_id
    and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "private own insert" on private_messages;
create policy "private own insert" on private_messages for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "friends own all" on friends;
create policy "friends own all" on friends for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorites own all" on favorites;
create policy "favorites own all" on favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "blocks own all" on blocks;
create policy "blocks own all" on blocks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reports own insert" on reports;
create policy "reports own insert" on reports for insert to authenticated with check (auth.uid() = reporter_id);
