create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  odeyen_id     uuid not null references public.profiles (id),
  alan_id       uuid not null references public.profiles (id),
  tutar_kurus   bigint not null check (tutar_kurus > 0 and tutar_kurus <= 100000000),
  tarih         date not null default current_date,
  olusturan_id  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  check (odeyen_id <> alan_id)
);

create index settlements_group_tarih_idx on public.settlements (group_id, tarih desc);

alter table public.settlements enable row level security;

create policy "Grup uyeleri odemeleri gorebilir"
  on public.settlements for select
  to authenticated
  using (public.grup_uyesi_mi(group_id));

grant select on public.settlements to authenticated;
create or replace function public.odeme_kaydet(
  p_grup_id      uuid,
  p_odeyen_id    uuid,
  p_alan_id      uuid,
  p_tutar_kurus  bigint,
  p_tarih        date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben  uuid := auth.uid();
  v_id   uuid;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  if not public.grup_uyesi_mi(p_grup_id) then
    raise exception 'Bu grubun üyesi değilsin' using errcode = '42501';
  end if;

  if v_ben is distinct from p_odeyen_id and v_ben is distinct from p_alan_id then
    raise exception 'Ödemeyi sadece ödeyen ya da alan kişi kaydedebilir' using errcode = '22023';
  end if;

  if p_odeyen_id = p_alan_id then
    raise exception 'Kişi kendine ödeme yapamaz' using errcode = '22023';
  end if;

  if (
    select count(*) from public.group_members
    where group_id = p_grup_id and user_id in (p_odeyen_id, p_alan_id)
  ) <> 2 then
    raise exception 'Kişilerden biri grupta değil' using errcode = '22023';
  end if;

  if p_tarih is not null and p_tarih > current_date + 1 then
    raise exception 'Tarih ileri bir gün olamaz' using errcode = '22023';
  end if;

  insert into public.settlements
    (group_id, odeyen_id, alan_id, tutar_kurus, tarih, olusturan_id)
  values
    (p_grup_id, p_odeyen_id, p_alan_id, p_tutar_kurus, coalesce(p_tarih, current_date), v_ben)
  returning id into v_id;

  return v_id;
end;
$$;
create or replace function public.grup_bakiyeleri(p_grup_id uuid)
returns table (uye_id uuid, net_kurus bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.user_id,
    (
        coalesce((select sum(e.tutar_kurus) from public.expenses e
                  where e.group_id = p_grup_id and e.odeyen_id = m.user_id), 0)
      - coalesce((select sum(s.pay_kurus) from public.expense_splits s
                  join public.expenses e on e.id = s.expense_id
                  where e.group_id = p_grup_id and s.user_id = m.user_id), 0)
      + coalesce((select sum(t.tutar_kurus) from public.settlements t
                  where t.group_id = p_grup_id and t.odeyen_id = m.user_id), 0)
      - coalesce((select sum(t.tutar_kurus) from public.settlements t
                  where t.group_id = p_grup_id and t.alan_id = m.user_id), 0)
    )::bigint
  from public.group_members m
  where m.group_id = p_grup_id
  order by 2 desc;
$$;

revoke execute on function public.odeme_kaydet(uuid, uuid, uuid, bigint, date) from public, anon;
grant  execute on function public.odeme_kaydet(uuid, uuid, uuid, bigint, date) to authenticated;

revoke execute on function public.grup_bakiyeleri(uuid) from public, anon;
grant  execute on function public.grup_bakiyeleri(uuid) to authenticated;
