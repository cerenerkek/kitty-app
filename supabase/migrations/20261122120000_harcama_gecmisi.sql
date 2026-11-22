-- =========================================================
-- Gün 7 / Bölüm 1: Harcama silme + değişiklik geçmişi
--
-- Fikir: Silmeden ÖNCE harcamanın son halini geçmiş tablosuna kopyala,
-- sonra gerçekten sil. Böylece bakiye, özet ve liste sorgularının
-- hiçbiri değişmiyor; silinen harcama hesaplardan kendiliğinden çıkıyor.
-- =========================================================

-- ---------------------------------------------------------
-- PARÇA 1: Geçmiş tablosu
-- ---------------------------------------------------------
create table public.expense_history (
  id          bigint generated always as identity primary key,
  group_id    uuid not null references public.groups (id) on delete cascade,
  -- Bilerek yabancı anahtar YOK: harcama silinince geçmiş kaydı kalmalı
  expense_id  uuid not null,
  islem       text not null check (
                islem in ('eklendi', 'duzenlendi', 'silindi', 'fis_eklendi', 'fis_kaldirildi')
              ),
  yapan_id    uuid references public.profiles (id) on delete set null,
  eski        jsonb,  -- işlemden önceki hali (eklemede boş)
  yeni        jsonb,  -- işlemden sonraki hali (silmede boş)
  zaman       timestamptz not null default now()
);

create index expense_history_group_zaman_idx on public.expense_history (group_id, zaman desc);
create index expense_history_expense_idx on public.expense_history (expense_id);

alter table public.expense_history enable row level security;

create policy "Grup uyeleri gecmisi gorebilir"
  on public.expense_history for select
  to authenticated
  using (public.grup_uyesi_mi(group_id));

-- Sadece okuma. Geçmiş değiştirilemez, silinemez; yazan sadece fonksiyonlar.
grant select on public.expense_history to authenticated;

-- ---------------------------------------------------------
-- PARÇA 2: Harcamanın anlık görüntüsü (JSON) + harcama_ekle güncellemesi
-- ---------------------------------------------------------

-- İç yardımcı: bir harcamanın o anki hali, payları dahil.
-- API'den çağrılamaz (aşağıda izinleri kaldırılıyor); sadece fonksiyonlar kullanır.
create or replace function public.harcama_jsonu(p_harcama_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'aciklama',    e.aciklama,
    'tutar_kurus', e.tutar_kurus,
    'kategori',    e.kategori,
    'tarih',       e.tarih,
    'odeyen_id',   e.odeyen_id,
    'paylar',      coalesce(
                     (select jsonb_object_agg(s.user_id, s.pay_kurus)
                      from public.expense_splits s
                      where s.expense_id = e.id),
                     '{}'::jsonb)
  )
  from public.expenses e
  where e.id = p_harcama_id;
$$;

revoke execute on function public.harcama_jsonu(uuid) from public, anon, authenticated;

-- harcama_ekle: Gün 3'teki fonksiyonun aynısı + sonunda geçmişe "eklendi" kaydı
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
  v_harcama_id  uuid;
  v_kisi_sayisi int;
  v_taban       bigint;
  v_artan       bigint;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  if not public.grup_uyesi_mi(p_grup_id) then
    raise exception 'Bu grubun üyesi değilsin' using errcode = '42501';
  end if;

  select array_agg(distinct x) into p_bolunenler
  from unnest(p_bolunenler) as x
  where x is not null;

  v_kisi_sayisi := coalesce(array_length(p_bolunenler, 1), 0);
  if v_kisi_sayisi = 0 then
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
    where group_id = p_grup_id and user_id = any (p_bolunenler)
  ) <> v_kisi_sayisi then
    raise exception 'Seçilen kişilerden biri grupta değil' using errcode = '22023';
  end if;

  if p_tarih is not null and p_tarih > current_date + 1 then
    raise exception 'Tarih ileri bir gün olamaz' using errcode = '22023';
  end if;

  insert into public.expenses
    (group_id, aciklama, tutar_kurus, odeyen_id, kategori, tarih, olusturan_id)
  values
    (p_grup_id, trim(p_aciklama), p_tutar_kurus, p_odeyen_id, p_kategori,
     coalesce(p_tarih, current_date), auth.uid())
  returning id into v_harcama_id;

  v_taban := p_tutar_kurus / v_kisi_sayisi;
  v_artan := p_tutar_kurus % v_kisi_sayisi;

  insert into public.expense_splits (expense_id, user_id, pay_kurus)
  select v_harcama_id,
         kisi,
         v_taban + case when sira <= v_artan then 1 else 0 end
  from unnest(p_bolunenler) with ordinality as t(kisi, sira);

  -- YENİ: geçmişe "eklendi" kaydı
  insert into public.expense_history (group_id, expense_id, islem, yapan_id, yeni)
  values (p_grup_id, v_harcama_id, 'eklendi', auth.uid(), public.harcama_jsonu(v_harcama_id));

  return v_harcama_id;
end;
$$;

-- Mevcut harcamalar için geriye dönük "eklendi" kayıtları (zamanı: eklenme anı)
insert into public.expense_history (group_id, expense_id, islem, yapan_id, yeni, zaman)
select e.group_id, e.id, 'eklendi', e.olusturan_id, public.harcama_jsonu(e.id), e.created_at
from public.expenses e;

-- ---------------------------------------------------------
-- PARÇA 3: harcama_sil
-- ---------------------------------------------------------
create or replace function public.harcama_sil(p_harcama_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben        uuid := auth.uid();
  v_grup_id    uuid;
  v_olusturan  uuid;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select group_id, olusturan_id into v_grup_id, v_olusturan
  from public.expenses
  where id = p_harcama_id;

  -- Harcama yoksa YA DA üyesi olmadığın bir gruptaysa: aynı cevap.
  -- (Başka grubun harcamasının var olduğunu ele vermiyoruz.)
  if v_grup_id is null or not public.grup_uyesi_mi(v_grup_id) then
    raise exception 'Harcama bulunamadı' using errcode = 'P0002';
  end if;

  -- Yetki: harcamayı ekleyen kişi ya da grup yöneticisi
  if v_ben is distinct from v_olusturan and not exists (
    select 1 from public.group_members
    where group_id = v_grup_id and user_id = v_ben and rol = 'admin'
  ) then
    raise exception 'Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi silebilir'
      using errcode = '42501';
  end if;

  -- Önce geçmişe son halini yaz, sonra sil (paylar cascade ile silinir)
  insert into public.expense_history (group_id, expense_id, islem, yapan_id, eski)
  values (v_grup_id, p_harcama_id, 'silindi', v_ben, public.harcama_jsonu(p_harcama_id));

  delete from public.expenses where id = p_harcama_id;
end;
$$;

revoke execute on function public.harcama_sil(uuid) from public, anon;
grant  execute on function public.harcama_sil(uuid) to authenticated;
