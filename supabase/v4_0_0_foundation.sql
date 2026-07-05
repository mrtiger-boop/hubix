create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  email text,
  pseudo text unique not null,
  bio text default '',
  age int check (age >= 18),
  gender text default 'Peu importe',
  country text default 'France',
  region text default '',
  city text default '',
  lang text default 'Français',
  interests text[] default '{}',
  goals text[] default '{}',
  status text default 'En ligne',
  custom_status text default '',
  avatar_url text,
  banner_url text,
  level int default 1,
  xp int default 0,
  rubies int default 2500,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_online boolean default false,
  page text default '',
  last_seen timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists online_status (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_online boolean default false,
  last_seen timestamptz default now()
);

create table if not exists world_rooms (
  id uuid primary key default gen_random_uuid(),
  lang text not null,
  room int not null default 1,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(lang, room)
);

insert into world_rooms(lang, room, name)
values
('Français', 1, 'Français #1'),
('Français', 2, 'Français #2'),
('Français', 3, 'Français #3'),
('English', 1, 'English #1'),
('English', 2, 'English #2'),
('English', 3, 'English #3'),
('Español', 1, 'Español #1'),
('Español', 2, 'Español #2'),
('Español', 3, 'Español #3')
on conflict(lang, room) do nothing;

create table if not exists world_messages (
  id uuid primary key default gen_random_uuid(),
  lang text not null,
  room int default 1,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  image_url text,
  reply_to uuid references world_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  compatibility int default 85,
  active boolean default true,
  created_at timestamptz default now()
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

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade,
  reported_id uuid references profiles(id) on delete cascade,
  message_id uuid,
  reason text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists user_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  allow_friend_requests boolean default true,
  show_online boolean default true,
  private_profile boolean default false,
  notification_sound boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_pseudo on profiles(pseudo);
create index if not exists idx_presence_online on presence(is_online);
create index if not exists idx_world_messages_room on world_messages(lang, room, created_at);
create index if not exists idx_private_messages_match on private_messages(match_id, created_at);
create index if not exists idx_notifications_user on notifications(user_id, is_read, created_at);

alter table profiles enable row level security;
alter table presence enable row level security;
alter table online_status enable row level security;
alter table world_rooms enable row level security;
alter table world_messages enable row level security;
alter table matches enable row level security;
alter table private_messages enable row level security;
alter table friend_requests enable row level security;
alter table friends enable row level security;
alter table favorites enable row level security;
alter table blocks enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table user_settings enable row level security;

drop policy if exists "profiles read all" on profiles;
create policy "profiles read all" on profiles for select using (true);
drop policy if exists "profiles own insert" on profiles;
create policy "profiles own insert" on profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles own update" on profiles;
create policy "profiles own update" on profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "presence read all" on presence;
create policy "presence read all" on presence for select using (true);
drop policy if exists "presence own all" on presence;
create policy "presence own all" on presence for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "online read all" on online_status;
create policy "online read all" on online_status for select using (true);
drop policy if exists "online own all" on online_status;
create policy "online own all" on online_status for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "world rooms read all" on world_rooms;
create policy "world rooms read all" on world_rooms for select using (true);

drop policy if exists "world read all" on world_messages;
create policy "world read all" on world_messages for select using (deleted_at is null);
drop policy if exists "world own insert" on world_messages;
create policy "world own insert" on world_messages for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "world own update" on world_messages;
create policy "world own update" on world_messages for update to authenticated using (auth.uid() = sender_id);

drop policy if exists "matches read participants" on matches;
create policy "matches read participants" on matches for select using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "matches create participants" on matches;
create policy "matches create participants" on matches for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);

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
drop policy if exists "private own update" on private_messages;
create policy "private own update" on private_messages for update to authenticated using (auth.uid() = sender_id);

drop policy if exists "friend requests involved read" on friend_requests;
create policy "friend requests involved read" on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "friend requests own insert" on friend_requests;
create policy "friend requests own insert" on friend_requests for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "friend requests receiver update" on friend_requests;
create policy "friend requests receiver update" on friend_requests for update to authenticated using (auth.uid() = receiver_id or auth.uid() = sender_id);

drop policy if exists "friends own all" on friends;
create policy "friends own all" on friends for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "favorites own all" on favorites;
create policy "favorites own all" on favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "blocks own all" on blocks;
create policy "blocks own all" on blocks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications own read" on notifications;
create policy "notifications own read" on notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "notifications own update" on notifications;
create policy "notifications own update" on notifications for update to authenticated using (auth.uid() = user_id);
drop policy if exists "notifications own insert" on notifications;
create policy "notifications own insert" on notifications for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "reports own insert" on reports;
create policy "reports own insert" on reports for insert to authenticated with check (auth.uid() = reporter_id);

drop policy if exists "settings own all" on user_settings;
create policy "settings own all" on user_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
