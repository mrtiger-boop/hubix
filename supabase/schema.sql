-- Hubix v2.2 base Supabase pour passage en ligne

create table if not exists profiles (
  id uuid primary key,
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

create table if not exists match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  gender_filter text default 'Peu importe',
  age_filter text default 'Peu importe',
  country_filter text default 'Monde entier',
  lang_filter text default 'Français',
  purpose_filter text[] default '{}',
  interests_filter text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists private_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  image_url text,
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

create table if not exists friends (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  favorite_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, favorite_id)
);

create table if not exists blocks (
  user_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, blocked_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade,
  reported_id uuid references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);
