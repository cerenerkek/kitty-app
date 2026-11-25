create or replace function public.uye_bakiyesi(p_grup_id uuid, p_kisi_id uuid)
returns bigint
language sql
stable
set search_path = ''
as $$
  select (
      coalesce((select sum(e.tutar_kurus) from public.expenses e
                where e.group_id = p_grup_id and e.odeyen_id = p_kisi_id), 0)
    - coalesce((select sum(s.pay_kurus) from public.expense_splits s
                join public.expenses e on e.id = s.expense_id
                where e.group_id = p_grup_id and s.user_id = p_kisi_id), 0)
    + coalesce((select sum(t.tutar_kurus) from public.settlements t
                where t.group_id = p_grup_id and t.odeyen_id = p_kisi_id), 0)
    - coalesce((select sum(t.tutar_kurus) from public.settlements t
                where t.group_id = p_grup_id and t.alan_id = p_kisi_id), 0)
  )::bigint;
$$;

revoke execute on function public.uye_bakiyesi(uuid, uuid) from public, anon, authenticated;


create or replace function public.gruptan_cik(p_grup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben  uuid := auth.uid();
  v_rol  text;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select rol into v_rol
  from public.group_members
  where group_id = p_grup_id and user_id = v_ben
  for update;

  if v_rol is null then
    raise exception 'Grup bulunamadı' using errcode = 'P0002';
  end if;

  if (select count(*) from public.group_members where group_id = p_grup_id) = 1 then
    raise exception 'Gruptaki tek kişi sensin. Ayrılmak yerine grubu silebilirsin.'
      using errcode = '22023';
  end if;

  if public.uye_bakiyesi(p_grup_id, v_ben) <> 0 then
    raise exception 'Gruptan ayrılmadan önce borcunun ya da alacağının kapanması gerekiyor.'
      using errcode = '22023';
  end if;

  if v_rol = 'admin' and not exists (
    select 1 from public.group_members
    where group_id = p_grup_id and rol = 'admin' and user_id <> v_ben
  ) then
    update public.group_members
    set rol = 'admin'
    where group_id = p_grup_id
      and user_id = (
        select user_id from public.group_members
        where group_id = p_grup_id and user_id <> v_ben
        order by katilma_tarihi, user_id
        limit 1
      );
  end if;

  delete from public.group_members
  where group_id = p_grup_id and user_id = v_ben;
end;
$$;

revoke execute on function public.gruptan_cik(uuid) from public, anon;
grant  execute on function public.gruptan_cik(uuid) to authenticated;


create or replace function public.uyeyi_cikar(p_grup_id uuid, p_kisi_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben uuid := auth.uid();
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  if not public.grup_uyesi_mi(p_grup_id) then
    raise exception 'Grup bulunamadı' using errcode = 'P0002';
  end if;

  if not public.grup_yoneticisi_mi(p_grup_id) then
    raise exception 'Üyeleri sadece yönetici çıkarabilir' using errcode = '42501';
  end if;

  if p_kisi_id is not distinct from v_ben then
    raise exception 'Kendini çıkaramazsın. "Gruptan çık" butonunu kullan.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_grup_id and user_id = p_kisi_id
  ) then
    raise exception 'Bu kişi grupta değil' using errcode = '22023';
  end if;

  if public.uye_bakiyesi(p_grup_id, p_kisi_id) <> 0 then
    raise exception 'Bu kişinin borcu ya da alacağı kapanmadan gruptan çıkarılamaz.'
      using errcode = '22023';
  end if;

  delete from public.group_members
  where group_id = p_grup_id and user_id = p_kisi_id;
end;
$$;

revoke execute on function public.uyeyi_cikar(uuid, uuid) from public, anon;
grant  execute on function public.uyeyi_cikar(uuid, uuid) to authenticated;


create or replace function public.eski_uye_adlari(p_grup_id uuid)
returns table (kisi_id uuid, ad_soyad text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.ad_soyad
  from public.profiles p
  where public.grup_uyesi_mi(p_grup_id)
    and p.id in (
      select e.odeyen_id from public.expenses e where e.group_id = p_grup_id
      union
      select s.user_id from public.expense_splits s
      join public.expenses e on e.id = s.expense_id
      where e.group_id = p_grup_id
      union
      select t.odeyen_id from public.settlements t where t.group_id = p_grup_id
      union
      select t.alan_id from public.settlements t where t.group_id = p_grup_id
      union
      select h.yapan_id from public.expense_history h where h.group_id = p_grup_id
    )
    and not exists (
      select 1 from public.group_members m
      where m.group_id = p_grup_id and m.user_id = p.id
    );
$$;

revoke execute on function public.eski_uye_adlari(uuid) from public, anon;
grant  execute on function public.eski_uye_adlari(uuid) to authenticated;


create or replace function public.ayrilan_uye_korumasi_harcama()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.groups where id = old.group_id) then
    return old;
  end if;

  if tg_op = 'UPDATE'
     and new.tutar_kurus = old.tutar_kurus
     and new.odeyen_id = old.odeyen_id then
    return new;
  end if;

  if exists (
    select 1
    from (
      select old.odeyen_id as kisi
      union
      select s.user_id from public.expense_splits s where s.expense_id = old.id
    ) k
    where not exists (
      select 1 from public.group_members m
      where m.group_id = old.group_id and m.user_id = k.kisi
    )
  ) then
    raise exception 'Bu harcamada gruptan ayrılmış biri var. Bu yüzden silinemez ve düzenlenemez.'
      using errcode = '22023';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger expenses_ayrilan_uye_korumasi
  before delete or update on public.expenses
  for each row execute function public.ayrilan_uye_korumasi_harcama();


create or replace function public.ayrilan_uye_korumasi_pay()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grup uuid;
begin
  select group_id into v_grup from public.expenses where id = old.expense_id;

  if v_grup is null then
    return old;
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = v_grup and user_id = old.user_id
  ) then
    raise exception 'Bu harcamada gruptan ayrılmış biri var. Bu yüzden silinemez ve düzenlenemez.'
      using errcode = '22023';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger expense_splits_ayrilan_uye_korumasi
  before delete or update on public.expense_splits
  for each row execute function public.ayrilan_uye_korumasi_pay();

revoke execute on function public.ayrilan_uye_korumasi_harcama() from public, anon, authenticated;
revoke execute on function public.ayrilan_uye_korumasi_pay() from public, anon, authenticated;