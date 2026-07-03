create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  email text,
  pseudo text unique not null,
  bio text default '',
  age int check (age >= 18),
  gender text default 'Peu importe',
  country text default 'France',
  lang text default 'Français',
  status text default 'En ligne',
  avatar_url text,
  level int default 1,
  xp int default 0,
  created_at timestamptz default now()
);

create table if not exists online_status (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_online boolean default false,
  last_seen timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists world_messages (
  id uuid primary key default gen_random_uuid(),
  lang text not null,
  room int default 1,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table online_status enable row level security;
alter table matches enable row level security;
alter table world_messages enable row level security;

drop policy if exists "profiles read all" on profiles;
create policy "profiles read all" on profiles for select using (true);

drop policy if exists "profiles own insert" on profiles;
create policy "profiles own insert" on profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles own update" on profiles;
create policy "profiles own update" on profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "online read all" on online_status;
create policy "online read all" on online_status for select using (true);

drop policy if exists "online own all" on online_status;
create policy "online own all" on online_status for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "matches read participants" on matches;
create policy "matches read participants" on matches for select using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches create participants" on matches;
create policy "matches create participants" on matches for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "world read all" on world_messages;
create policy "world read all" on world_messages for select using (true);

drop policy if exists "world own insert" on world_messages;
create policy "world own insert" on world_messages for insert to authenticated with check (auth.uid() = sender_id);
