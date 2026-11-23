create table public.groups (
  id            uuid primary key default gen_random_uuid(),
  ad            text not null check (char_length(trim(ad)) between 2 and 50),
  olusturan_id  uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.group_members (
  group_id        uuid not null references public.groups (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  rol             text not null default 'uye' check (rol in ('admin', 'uye')),
  katilma_tarihi  timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members (user_id);

create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  token         text not null unique default replace(gen_random_uuid()::text, '-', ''),
  son_kullanma  timestamptz not null default now() + interval '7 days',
  olusturan_id  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index invites_group_id_idx on public.invites (group_id);

alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.invites       enable row level security;

create function public.grup_uyesi_mi(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = (select auth.uid())
  );
$$;

create function public.ortak_grupta_mi(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members benim
    join public.group_members onun on onun.group_id = benim.group_id
    where benim.user_id = (select auth.uid())
      and onun.user_id = p_user_id
  );
$$;

create policy "Uyesi oldugu gruplari gorebilir"
  on public.groups for select
  to authenticated
  using (public.grup_uyesi_mi(id));

create policy "Kendi gruplarinin uyelerini gorebilir"
  on public.group_members for select
  to authenticated
  using (public.grup_uyesi_mi(group_id));

create policy "Kendi gruplarinin davetlerini gorebilir"
  on public.invites for select
  to authenticated
  using (public.grup_uyesi_mi(group_id));

create policy "Uyesi oldugu gruba davet olusturabilir"
  on public.invites for insert
  to authenticated
  with check (
    public.grup_uyesi_mi(group_id)
    and olusturan_id = (select auth.uid())
  );

create policy "Ayni gruptakilerin profilini gorebilir"
  on public.profiles for select
  to authenticated
  using (public.ortak_grupta_mi(id));

create function public.grup_olustur(p_ad text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kullanici uuid := (select auth.uid());
  v_grup_id   uuid;
begin
  if v_kullanici is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  insert into public.groups (ad, olusturan_id)
  values (trim(p_ad), v_kullanici)
  returning id into v_grup_id;

  insert into public.group_members (group_id, user_id, rol)
  values (v_grup_id, v_kullanici, 'admin');

  return v_grup_id;
end;
$$;
create function public.davet_bilgisi(p_token text)
returns table (
  grup_id     uuid,
  grup_adi    text,
  davet_eden  text,
  uye_sayisi  integer,
  zaten_uye   boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    g.id,
    g.ad,
    p.ad_soyad,
    (select count(*)::integer from public.group_members m where m.group_id = g.id),
    exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = (select auth.uid())
    )
  from public.invites i
  join public.groups g on g.id = i.group_id
  left join public.profiles p on p.id = i.olusturan_id
  where i.token = p_token
    and i.son_kullanma > now();
$$;

create function public.davete_katil(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kullanici uuid := (select auth.uid());
  v_grup_id   uuid;
begin
  if v_kullanici is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select group_id into v_grup_id
  from public.invites
  where token = p_token
    and son_kullanma > now();

  if v_grup_id is null then
    raise exception 'Davet geçersiz veya süresi dolmuş' using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id, rol)
  values (v_grup_id, v_kullanici, 'uye')
  on conflict (group_id, user_id) do nothing;

  return v_grup_id;
end;
$$;

grant select         on public.groups        to authenticated;
grant select         on public.group_members to authenticated;
grant select, insert on public.invites       to authenticated;

revoke execute on function public.grup_uyesi_mi(uuid)   from public, anon;
revoke execute on function public.ortak_grupta_mi(uuid) from public, anon;
revoke execute on function public.grup_olustur(text)    from public, anon;
revoke execute on function public.davete_katil(text)    from public, anon;
revoke execute on function public.davet_bilgisi(text)   from public;

grant execute on function public.grup_uyesi_mi(uuid)   to authenticated;
grant execute on function public.ortak_grupta_mi(uuid) to authenticated;
grant execute on function public.grup_olustur(text)    to authenticated;
grant execute on function public.davete_katil(text)    to authenticated;
grant execute on function public.davet_bilgisi(text)   to anon, authenticated;
