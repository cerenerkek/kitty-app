-- ============================================================
-- profiles: kullanıcıların uygulama içi profil bilgisi
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  ad_soyad    text not null check (char_length(ad_soyad) between 2 and 60),
  created_at  timestamptz not null default now()
);

-- 1. katman: RLS (hangi SATIRLARI görebilir?)
alter table public.profiles enable row level security;

-- 2. katman: GRANT (tabloya erişebilir mi?)
grant select, update on public.profiles to authenticated;

-- Kural: kişi sadece kendi profilini görür ve günceller.
-- (2. gün: aynı gruptaki kişilerin birbirini görmesi için genişleteceğiz)
create policy "Kendi profilini görebilir"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Kendi profilini güncelleyebilir"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============================================================
-- Kayıt olunca otomatik profil oluştur
-- ============================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, ad_soyad)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'ad_soyad', 'İsimsiz'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();