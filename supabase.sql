
-- =========================================================
-- BİRLİKTEBUL: VERİTABANI + RLS + PROFİL FOTOĞRAFLARI
-- Supabase SQL Editor'da çalıştır.
-- =========================================================

create extension if not exists pgcrypto;

-- 1. PROFİLLER
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Kullanıcı'
    check (char_length(display_name) between 1 and 60),
  city text check (city is null or char_length(city) <= 80),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Var olan profiles tablosuna yeni kolonları ekler.
alter table public.profiles
  add column if not exists display_name text not null default 'Kullanıcı';

alter table public.profiles
  add column if not exists city text;

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();


-- 2. BECERİ İLANLARI
create table if not exists public.skill_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 1500),
  category text not null check (
    category in (
      'Yazılım', 'Tasarım', 'Dil', 'Müzik',
      'Fotoğrafçılık', 'El sanatları', 'Eğitim', 'Diğer'
    )
  ),
  city text check (city is null or char_length(city) <= 80),
  created_at timestamptz not null default now(),
  constraint skill_offers_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);

create index if not exists skill_offers_created_at_idx
  on public.skill_offers(created_at desc);

create index if not exists skill_offers_user_id_idx
  on public.skill_offers(user_id);

create index if not exists skill_offers_category_idx
  on public.skill_offers(category);


-- 3. ÖĞRENME TALEPLERİ
create table if not exists public.skill_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null,
  requester_id uuid not null,
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),

  constraint skill_requests_offer_id_fkey
    foreign key (offer_id) references public.skill_offers(id) on delete cascade,

  constraint skill_requests_requester_id_fkey
    foreign key (requester_id) references public.profiles(id) on delete cascade,

  constraint skill_requests_unique_request
    unique (offer_id, requester_id)
);

create index if not exists skill_requests_requester_id_idx
  on public.skill_requests(requester_id);

create index if not exists skill_requests_offer_id_idx
  on public.skill_requests(offer_id);


-- 4. YENİ KULLANICI KAYDOLUNCA PROFİL OLUŞTUR
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Kullanıcı'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- 5. updated_at OTOMATİK GÜNCELLEME
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();


-- 6. RLS'Yİ AÇ
alter table public.profiles enable row level security;
alter table public.skill_offers enable row level security;
alter table public.skill_requests enable row level security;


-- 7. POLİTİKALARI YENİDEN KUR
drop policy if exists "Profiles are visible to everyone" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

drop policy if exists "Skill offers are visible to everyone" on public.skill_offers;
drop policy if exists "Users create own offers" on public.skill_offers;
drop policy if exists "Users update own offers" on public.skill_offers;
drop policy if exists "Users delete own offers" on public.skill_offers;

drop policy if exists "Request participants can read requests" on public.skill_requests;
drop policy if exists "Users request another user's offer" on public.skill_requests;
drop policy if exists "Offer owners can update request status" on public.skill_requests;
drop policy if exists "Requesters cancel own pending requests" on public.skill_requests;


-- Profiller: görüntüleme herkese açık, yazma yalnızca sahibine ait.
create policy "Profiles are visible to everyone"
on public.profiles for select
to anon, authenticated
using (true);

create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- İlanlar: görüntüleme herkese açık, değişiklik sahibine ait.
create policy "Skill offers are visible to everyone"
on public.skill_offers for select
to anon, authenticated
using (true);

create policy "Users create own offers"
on public.skill_offers for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users update own offers"
on public.skill_offers for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own offers"
on public.skill_offers for delete
to authenticated
using (auth.uid() = user_id);


-- Talepleri yalnızca talebi gönderen ve ilanın sahibi görebilir.
create policy "Request participants can read requests"
on public.skill_requests for select
to authenticated
using (
  requester_id = (select auth.uid())
  or exists (
    select 1
    from public.skill_offers o
    where o.id = skill_requests.offer_id
      and o.user_id = (select auth.uid())
  )
);

-- Kullanıcı yalnızca kendi adına, başka birinin ilanına talep gönderebilir.
create policy "Users request another user's offer"
on public.skill_requests for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1
    from public.skill_offers o
    where o.id = skill_requests.offer_id
      and o.user_id <> (select auth.uid())
  )
);

-- İlan sahibi yalnızca kendi ilanına gelen taleplerin durumunu değiştirebilir.
create policy "Offer owners can update request status"
on public.skill_requests for update
to authenticated
using (
  exists (
    select 1
    from public.skill_offers o
    where o.id = skill_requests.offer_id
      and o.user_id = (select auth.uid())
  )
)
with check (
  status in ('pending', 'accepted', 'declined', 'cancelled')
  and exists (
    select 1
    from public.skill_offers o
    where o.id = skill_requests.offer_id
      and o.user_id = (select auth.uid())
  )
);

-- Kullanıcı kendi bekleyen talebini iptal edebilir.
create policy "Requesters cancel own pending requests"
on public.skill_requests for update
to authenticated
using (
  requester_id = (select auth.uid())
  and status = 'pending'
)
with check (
  requester_id = (select auth.uid())
  and status = 'cancelled'
);


-- 8. TABLO ERİŞİM İZİNLERİ
grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.skill_offers to anon, authenticated;
grant insert, update, delete on public.skill_offers to authenticated;

grant select, insert, update on public.skill_requests to authenticated;


-- 9. PROFİL FOTOĞRAFI DEPOLAMA ALANI
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];


drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users upload avatars to own folder" on storage.objects;
drop policy if exists "Users update avatars in own folder" on storage.objects;
drop policy if exists "Users delete avatars in own folder" on storage.objects;

create policy "Avatar images are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Users upload avatars to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users update avatars in own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete avatars in own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- 10. ESKİ PROFİLLERİ OLAN HESAPLAR İÇİN TAMAMLAMA
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(left(u.raw_user_meta_data ->> 'display_name', 60), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Kullanıcı'
  )
from auth.users u
on conflict (id) do nothing;

-- Kurulum tamamlandı.
