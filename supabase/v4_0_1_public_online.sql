create extension if not exists "pgcrypto";

alter table profiles add column if not exists rubies int default 2500;
alter table profiles add column if not exists region text default '';
alter table profiles add column if not exists city text default '';
alter table profiles add column if not exists interests text[] default '{}';
alter table profiles add column if not exists goals text[] default '{}';
alter table profiles add column if not exists custom_status text default '';
alter table profiles add column if not exists banner_url text;
alter table profiles add column if not exists updated_at timestamptz default now();

create table if not exists presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_online boolean default false,
  page text default '',
  last_seen timestamptz default now(),
  updated_at timestamptz default now()
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

create table if not exists private_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  image_url text,
  seen_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

alter table world_messages add column if not exists image_url text;
alter table world_messages add column if not exists deleted_at timestamptz;
alter table world_messages add column if not exists edited_at timestamptz;

alter table presence enable row level security;
alter table friends enable row level security;
alter table favorites enable row level security;
alter table blocks enable row level security;
alter table private_messages enable row level security;

drop policy if exists "presence read all" on presence;
create policy "presence read all" on presence for select using (true);

drop policy if exists "presence own all" on presence;
create policy "presence own all" on presence for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "friends own all" on friends;
create policy "friends own all" on friends for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorites own all" on favorites;
create policy "favorites own all" on favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "blocks own all" on blocks;
create policy "blocks own all" on blocks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

drop policy if exists "world read all" on world_messages;
create policy "world read all" on world_messages for select using (deleted_at is null);

drop policy if exists "world own insert" on world_messages;
create policy "world own insert" on world_messages for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "matches create participants" on matches;
create policy "matches create participants" on matches for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches read participants" on matches;
create policy "matches read participants" on matches for select using (auth.uid() = user_a or auth.uid() = user_b);

create index if not exists idx_presence_online on presence(is_online);
create index if not exists idx_friends_user on friends(user_id);
create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_blocks_user on blocks(user_id);
create index if not exists idx_private_messages_match on private_messages(match_id, created_at);
create index if not exists idx_world_messages_room on world_messages(lang, room, created_at);
