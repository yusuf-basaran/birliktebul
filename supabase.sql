
-- BİRLİKTEBUL DATABASE
-- Supabase SQL Editor'da bir kez çalıştır.

create extension if not exists pgcrypto;

-- 1. Kullanıcı profilleri
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'BirlikteBul üyesi'
    check (char_length(display_name) between 1 and 40),
  city text check (city is null or char_length(city) <= 60),
  bio text check (bio is null or char_length(bio) <= 500),
  created_at timestamptz not null default now()
);

-- 2. Beceri paylaşımları
create table if not exists public.skill_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 70),
  description text not null check (char_length(description) between 10 and 500),
  category text not null check (
    category in (
      'Yazılım', 'Dil', 'Tasarım', 'Müzik',
      'Kişisel gelişim', 'Diğer'
    )
  ),
  city text check (city is null or char_length(city) <= 60),
  created_at timestamptz not null default now()
);

-- 3. Öğrenme/paylaşım istekleri
create table if not exists public.skill_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.skill_offers(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at timestamptz not null default now(),
  unique (offer_id, requester_id)
);

-- Arama ve sıralama performansı
create index if not exists skill_offers_created_at_idx
  on public.skill_offers(created_at desc);

create index if not exists skill_offers_category_idx
  on public.skill_offers(category);

create index if not exists skill_offers_user_id_idx
  on public.skill_offers(user_id);

create index if not exists skill_requests_requester_idx
  on public.skill_requests(requester_id);

-- 4. Yeni hesap için otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 40), ''),
    nullif(left(split_part(coalesce(new.email, ''), '@', 1), 40), ''),
    'BirlikteBul üyesi'
  );

  insert into public.profiles (id, display_name)
  values (new.id, chosen_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.skill_offers enable row level security;
alter table public.skill_requests enable row level security;

-- Profil politikaları
drop policy if exists "profiles_read_public" on public.profiles;
create policy "profiles_read_public"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Beceri politikaları
drop policy if exists "offers_read_public" on public.skill_offers;
create policy "offers_read_public"
on public.skill_offers for select
to anon, authenticated
using (true);

drop policy if exists "offers_insert_own" on public.skill_offers;
create policy "offers_insert_own"
on public.skill_offers for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "offers_update_own" on public.skill_offers;
create policy "offers_update_own"
on public.skill_offers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "offers_delete_own" on public.skill_offers;
create policy "offers_delete_own"
on public.skill_offers for delete
to authenticated
using ((select auth.uid()) = user_id);

-- İstekleri yalnızca gönderen ve ilgili becerinin sahibi okuyabilir
drop policy if exists "requests_read_participants" on public.skill_requests;
create policy "requests_read_participants"
on public.skill_requests for select
to authenticated
using (
  (select auth.uid()) = requester_id
  or exists (
    select 1
    from public.skill_offers s
    where s.id = offer_id
      and s.user_id = (select auth.uid())
  )
);

-- Kullanıcı kendisi adına, başka bir kullanıcının becerisine istek gönderebilir
drop policy if exists "requests_insert_self" on public.skill_requests;
create policy "requests_insert_self"
on public.skill_requests for insert
to authenticated
with check (
  (select auth.uid()) = requester_id
  and exists (
    select 1
    from public.skill_offers s
    where s.id = offer_id
      and s.user_id <> (select auth.uid())
  )
);

-- Beceri sahibi yalnızca istek durumunu değiştirebilir
drop policy if exists "requests_owner_update" on public.skill_requests;
create policy "requests_owner_update"
on public.skill_requests for update
to authenticated
using (
  exists (
    select 1
    from public.skill_offers s
    where s.id = offer_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.skill_offers s
    where s.id = offer_id
      and s.user_id = (select auth.uid())
  )
);

-- 6. Tablo izinleri
grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (display_name, city, bio)
  on public.profiles to authenticated;

grant select on public.skill_offers to anon, authenticated;
grant insert, update, delete on public.skill_offers to authenticated;

grant select, insert on public.skill_requests to authenticated;
grant update (status) on public.skill_requests to authenticated;
