create extension if not exists "pgcrypto";

create table if not exists friend_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists friend_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references friend_conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  image_url text,
  seen_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

alter table friend_conversations enable row level security;
alter table friend_messages enable row level security;

drop policy if exists "friend conversations participants read" on friend_conversations;
create policy "friend conversations participants read"
on friend_conversations for select
using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "friend conversations participants insert" on friend_conversations;
create policy "friend conversations participants insert"
on friend_conversations for insert to authenticated
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "friend messages participants read" on friend_messages;
create policy "friend messages participants read"
on friend_messages for select
using (
  exists (
    select 1 from friend_conversations
    where friend_conversations.id = friend_messages.conversation_id
    and (friend_conversations.user_a = auth.uid() or friend_conversations.user_b = auth.uid())
  )
);

drop policy if exists "friend messages own insert" on friend_messages;
create policy "friend messages own insert"
on friend_messages for insert to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "friend messages own update" on friend_messages;
create policy "friend messages own update"
on friend_messages for update to authenticated
using (auth.uid() = sender_id);

delete from friend_conversations
where id not in (
  select min(id::text)::uuid
  from friend_conversations
  group by least(user_a::text, user_b::text), greatest(user_a::text, user_b::text)
);

create unique index if not exists unique_friend_conversation_pair
on friend_conversations (
  least(user_a::text, user_b::text),
  greatest(user_a::text, user_b::text)
);

create index if not exists idx_friend_messages_conversation
on friend_messages(conversation_id, created_at);
