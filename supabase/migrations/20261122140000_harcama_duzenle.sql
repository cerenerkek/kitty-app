create or replace function public.harcama_kisilerini_dogrula(
  p_grup_id    uuid,
  p_odeyen_id  uuid,
  p_bolunenler uuid[]
)
returns uuid[]
language plpgsql
stable
set search_path = ''
as $$
declare
  v_kisiler uuid[];
  v_sayi    int;
begin
  select array_agg(distinct x) into v_kisiler
  from unnest(p_bolunenler) as x
  where x is not null;

  v_sayi := coalesce(array_length(v_kisiler, 1), 0);
  if v_sayi = 0 then
    raise exception 'En az bir kişi seçmelisin' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_grup_id and user_id = p_odeyen_id
  ) then
    raise exception 'Ödeyen kişi grupta değil' using errcode = '22023';
  end if;

  if (
    select count(*) from public.group_members
    where group_id = p_grup_id and user_id = any (v_kisiler)
  ) <> v_sayi then
    raise exception 'Seçilen kişilerden biri grupta değil' using errcode = '22023';
  end if;

  return v_kisiler;
end;
$$;

create or replace function public.paylari_yaz(
  p_harcama_id  uuid,
  p_tutar_kurus bigint,
  p_kisiler     uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_sayi  int := array_length(p_kisiler, 1);
  v_taban bigint := p_tutar_kurus / v_sayi;
  v_artan bigint := p_tutar_kurus % v_sayi;
begin
  delete from public.expense_splits where expense_id = p_harcama_id;

  insert into public.expense_splits (expense_id, user_id, pay_kurus)
  select p_harcama_id,
         kisi,
         v_taban + case when sira <= v_artan then 1 else 0 end
  from unnest(p_kisiler) with ordinality as t(kisi, sira);
end;
$$;

revoke execute on function public.harcama_kisilerini_dogrula(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.paylari_yaz(uuid, bigint, uuid[]) from public, anon, authenticated;

create or replace function public.harcama_ekle(
  p_grup_id      uuid,
  p_aciklama     text,
  p_tutar_kurus  bigint,
  p_odeyen_id    uuid,
  p_kategori     text,
  p_tarih        date,
  p_bolunenler   uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_harcama_id uuid;
  v_kisiler    uuid[];
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  if not public.grup_uyesi_mi(p_grup_id) then
    raise exception 'Bu grubun üyesi değilsin' using errcode = '42501';
  end if;

  v_kisiler := public.harcama_kisilerini_dogrula(p_grup_id, p_odeyen_id, p_bolunenler);

  if p_tarih is not null and p_tarih > current_date + 1 then
    raise exception 'Tarih ileri bir gün olamaz' using errcode = '22023';
  end if;

  insert into public.expenses
    (group_id, aciklama, tutar_kurus, odeyen_id, kategori, tarih, olusturan_id)
  values
    (p_grup_id, trim(p_aciklama), p_tutar_kurus, p_odeyen_id, p_kategori,
     coalesce(p_tarih, current_date), auth.uid())
  returning id into v_harcama_id;

  perform public.paylari_yaz(v_harcama_id, p_tutar_kurus, v_kisiler);

  insert into public.expense_history (group_id, expense_id, islem, yapan_id, yeni)
  values (p_grup_id, v_harcama_id, 'eklendi', auth.uid(), public.harcama_jsonu(v_harcama_id));

  return v_harcama_id;
end;
$$;

create or replace function public.harcama_duzenle(
  p_harcama_id   uuid,
  p_aciklama     text,
  p_tutar_kurus  bigint,
  p_odeyen_id    uuid,
  p_kategori     text,
  p_tarih        date,
  p_bolunenler   uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben        uuid := auth.uid();
  v_grup_id    uuid;
  v_olusturan  uuid;
  v_kisiler    uuid[];
  v_eski       jsonb;
  v_yeni       jsonb;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select group_id, olusturan_id into v_grup_id, v_olusturan
  from public.expenses where id = p_harcama_id;

  if v_grup_id is null or not public.grup_uyesi_mi(v_grup_id) then
    raise exception 'Harcama bulunamadı' using errcode = 'P0002';
  end if;

  if v_ben is distinct from v_olusturan and not public.grup_yoneticisi_mi(v_grup_id) then
    raise exception 'Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi düzenleyebilir'
      using errcode = '42501';
  end if;

  v_kisiler := public.harcama_kisilerini_dogrula(v_grup_id, p_odeyen_id, p_bolunenler);

  if p_tarih is not null and p_tarih > current_date + 1 then
    raise exception 'Tarih ileri bir gün olamaz' using errcode = '22023';
  end if;

  v_eski := public.harcama_jsonu(p_harcama_id);

  update public.expenses
  set aciklama    = trim(p_aciklama),
      tutar_kurus = p_tutar_kurus,
      odeyen_id   = p_odeyen_id,
      kategori    = p_kategori,
      tarih       = coalesce(p_tarih, tarih)
  where id = p_harcama_id;

  perform public.paylari_yaz(p_harcama_id, p_tutar_kurus, v_kisiler);

  v_yeni := public.harcama_jsonu(p_harcama_id);

  if v_eski is distinct from v_yeni then
    insert into public.expense_history (group_id, expense_id, islem, yapan_id, eski, yeni)
    values (v_grup_id, p_harcama_id, 'duzenlendi', v_ben, v_eski, v_yeni);
  end if;
end;
$$;

revoke execute on function public.harcama_duzenle(uuid, text, bigint, uuid, text, date, uuid[]) from public, anon;
grant  execute on function public.harcama_duzenle(uuid, text, bigint, uuid, text, date, uuid[]) to authenticated;
