-- =========================================================
-- Gün 3: Harcamalar ve kişi başı paylar
-- Para birimi: KURUŞ (tam sayı). 450,50 TL = 45050
-- =========================================================

-- 1) Harcamalar
create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  aciklama      text not null check (char_length(trim(aciklama)) between 1 and 80),
  tutar_kurus   bigint not null check (tutar_kurus > 0 and tutar_kurus <= 100000000),
  odeyen_id     uuid not null references public.profiles (id),
  kategori      text not null check (
                  kategori in ('market', 'fatura', 'kira', 'ulasim', 'yemek', 'eglence', 'diger')
                ),
  tarih         date not null default current_date,
  olusturan_id  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Grup sayfası "bu grubun harcamaları, yeniden eskiye" diye sorar → bu index hızlandırır
create index expenses_group_tarih_idx on public.expenses (group_id, tarih desc);

-- 2) Kim ne kadar pay aldı (her harcama için kişi başı bir satır)
create table public.expense_splits (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id),
  pay_kurus   bigint not null check (pay_kurus >= 0),
  primary key (expense_id, user_id)
);

-- Gün 4'te "bu kişinin toplam payı" sorgusu için
create index expense_splits_user_idx on public.expense_splits (user_id);
-- =========================================================
-- RLS: sadece grubun üyeleri görebilir
-- =========================================================
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;

create policy "Grup uyeleri harcamalari gorebilir"
  on public.expenses for select
  to authenticated
  using (public.grup_uyesi_mi(group_id));

create policy "Grup uyeleri paylari gorebilir"
  on public.expense_splits for select
  to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.grup_uyesi_mi(e.group_id)
    )
  );

-- Kullanıcılar SADECE okuyabilir. Yazma işi aşağıdaki fonksiyondan geçer.
grant select on public.expenses       to authenticated;
grant select on public.expense_splits to authenticated;
-- =========================================================
-- harcama_ekle: harcamayı ve payları TEK işlemde yazar.
-- Bir hata olursa hiçbiri yazılmaz (transaction).
-- =========================================================
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
  -- 1) Giriş yapmış mı?
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  -- 2) Harcamayı ekleyen bu grubun üyesi mi?
  if not public.grup_uyesi_mi(p_grup_id) then
    raise exception 'Bu grubun üyesi değilsin' using errcode = '42501';
  end if;

  -- 3) Bölünecek kişiler: boşları ve tekrarları at
  select array_agg(distinct x) into p_bolunenler
  from unnest(p_bolunenler) as x
  where x is not null;

  v_kisi_sayisi := coalesce(array_length(p_bolunenler, 1), 0);
  if v_kisi_sayisi = 0 then
    raise exception 'En az bir kişi seçmelisin' using errcode = '22023';
  end if;

  -- 4) Ödeyen bu grubun üyesi mi?
  if not exists (
    select 1 from public.group_members
    where group_id = p_grup_id and user_id = p_odeyen_id
  ) then
    raise exception 'Ödeyen kişi grupta değil' using errcode = '22023';
  end if;

  -- 5) Bölünen herkes bu grubun üyesi mi?
  if (
    select count(*) from public.group_members
    where group_id = p_grup_id and user_id = any (p_bolunenler)
  ) <> v_kisi_sayisi then
    raise exception 'Seçilen kişilerden biri grupta değil' using errcode = '22023';
  end if;

  -- 6) Tarih ileri bir gün olamaz (+1 gün tolerans: sunucu UTC, Türkiye UTC+3)
  if p_tarih is not null and p_tarih > current_date + 1 then
    raise exception 'Tarih ileri bir gün olamaz' using errcode = '22023';
  end if;

  -- 7) Harcamayı yaz
  insert into public.expenses
    (group_id, aciklama, tutar_kurus, odeyen_id, kategori, tarih, olusturan_id)
  values
    (p_grup_id, trim(p_aciklama), p_tutar_kurus, p_odeyen_id, p_kategori,
     coalesce(p_tarih, current_date), auth.uid())
  returning id into v_harcama_id;

  -- 8) Eşit böl: taban pay + artan kuruşlar ilk kişilere birer birer
  --    Örnek: 10000 / 3 → taban 3333, artan 1 → 3334, 3333, 3333
  v_taban := p_tutar_kurus / v_kisi_sayisi;   -- tam sayı bölmesi
  v_artan := p_tutar_kurus % v_kisi_sayisi;   -- kalan

  insert into public.expense_splits (expense_id, user_id, pay_kurus)
  select v_harcama_id,
         kisi,
         v_taban + case when sira <= v_artan then 1 else 0 end
  from unnest(p_bolunenler) with ordinality as t(kisi, sira);

  return v_harcama_id;
end;
$$;

revoke execute on function public.harcama_ekle(uuid, text, bigint, uuid, text, date, uuid[])
  from public, anon;
grant execute on function public.harcama_ekle(uuid, text, bigint, uuid, text, date, uuid[])
  to authenticated;