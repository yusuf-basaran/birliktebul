-- Mevcut BirlikteBul kurulumu için veri silmeyen, tekrar çalıştırılabilir güncelleme.
-- Supabase Dashboard > SQL Editor içinde çalıştır.
begin;

-- RLS satırları korur; sütun izni kimlik ve mesajın değiştirilmesini engeller.
revoke update on public.skill_requests from authenticated;
grant update (status) on public.skill_requests to authenticated;

drop policy if exists "Offer owners can update request status" on public.skill_requests;
create policy "Offer owners can update request status"
on public.skill_requests for update to authenticated
using (
  status = 'pending' and exists (
    select 1 from public.skill_offers o
    where o.id = skill_requests.offer_id and o.user_id = (select auth.uid())
  )
)
with check (
  status in ('accepted', 'declined') and exists (
    select 1 from public.skill_offers o
    where o.id = skill_requests.offer_id and o.user_id = (select auth.uid())
  )
);

drop policy if exists "Requesters cancel own pending requests" on public.skill_requests;
create policy "Requesters cancel own pending requests"
on public.skill_requests for update to authenticated
using (requester_id = (select auth.uid()) and status = 'pending')
with check (requester_id = (select auth.uid()) and status = 'cancelled');

-- Kimlik alanlarını ve tamamlanmış talepleri ek politikalar olsa da koru.
create or replace function public.guard_request_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id
    or new.offer_id is distinct from old.offer_id
    or new.requester_id is distinct from old.requester_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'Talebin kimlik ve mesaj alanları değiştirilemez.';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted', 'declined', 'cancelled') then
    raise exception 'Yalnızca bekleyen talepler sonuçlandırılabilir.';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_request_update on public.skill_requests;
create trigger guard_request_update before update on public.skill_requests
for each row execute function public.guard_request_update();

-- Trigger fonksiyonlarının doğrudan API üzerinden çağrılmasına gerek yok.
revoke execute on function public.guard_request_update() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

commit;
