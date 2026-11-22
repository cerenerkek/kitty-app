-- =========================================================
-- Gün 7 / Bölüm 2: Fiş görselleri (Supabase Storage)
--
-- Dosya yolu: <grup_id>/<harcama_id>/<rastgele>.jpg
--   → yolun ilk klasörü grup id'si: güvenlik kuralları buna bakar.
-- Klasör GİZLİ: görseller sadece 1 saatlik imzalı linkle açılır.
-- =========================================================

-- ---------------------------------------------------------
-- PARÇA 1: Harcamaya fiş sütunu + gizli klasör (bucket)
-- ---------------------------------------------------------
alter table public.expenses add column fis_yolu text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fisler', 'fisler', false, 1048576,               -- en fazla 1 MB
        array['image/jpeg', 'image/png', 'image/webp'])  -- sadece resim
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- PARÇA 2: Yardımcı fonksiyonlar (Storage kuralları kullanır)
-- ---------------------------------------------------------

-- Grubun yöneticisi miyim?
create or replace function public.grup_yoneticisi_mi(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = (select auth.uid())
      and rol = 'admin'
  );
$$;

-- Bu yola fiş yükleyebilir miyim?
-- Yol "<grup>/<harcama>/<dosya>" biçiminde olmalı, harcama o grupta olmalı,
-- ve ben ya harcamayı ekleyen ya da grup yöneticisi olmalıyım.
create or replace function public.fis_yuklenebilir_mi(p_yol text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_parcalar text[] := string_to_array(p_yol, '/');
  v_uuid     text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_grup     uuid;
  v_harcama  uuid;
begin
  -- Biçim kontrolü (bozuk yol → hata değil, sadece "hayır")
  if array_length(v_parcalar, 1) <> 3
     or v_parcalar[1] !~ v_uuid
     or v_parcalar[2] !~ v_uuid then
    return false;
  end if;

  v_grup := v_parcalar[1]::uuid;
  v_harcama := v_parcalar[2]::uuid;

  return exists (
    select 1 from public.expenses e
    where e.id = v_harcama
      and e.group_id = v_grup
      and (e.olusturan_id = (select auth.uid()) or public.grup_yoneticisi_mi(v_grup))
  );
end;
$$;

revoke execute on function public.grup_yoneticisi_mi(uuid) from public, anon;
grant  execute on function public.grup_yoneticisi_mi(uuid) to authenticated;
revoke execute on function public.fis_yuklenebilir_mi(text) from public, anon;
grant  execute on function public.fis_yuklenebilir_mi(text) to authenticated;

-- ---------------------------------------------------------
-- PARÇA 3: Storage güvenlik kuralları (storage.objects tablosu)
-- ---------------------------------------------------------

-- Görme: sadece o grubun üyeleri (yolun ilk klasörü = grup id'si)
create policy "Fis: grup uyeleri gorebilir"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fisler'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.grup_uyesi_mi(((storage.foldername(name))[1])::uuid)
  );

-- Yükleme: sadece harcamayı ekleyen ya da yönetici, doğru yola
create policy "Fis: ekleyen veya yonetici yukleyebilir"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fisler'
    and public.fis_yuklenebilir_mi(name)
  );

-- Silme: dosyayı yükleyen kişi ya da grubun yöneticisi.
-- (Harcama silindikten SONRA da çalışmalı; bu yüzden harcamaya bakmıyor.)
create policy "Fis: yukleyen veya yonetici silebilir"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fisler'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and (
      owner_id = (select auth.uid())::text
      or public.grup_yoneticisi_mi(((storage.foldername(name))[1])::uuid)
    )
  );
-- Not: update kuralı yok → yüklenmiş fiş üzerine yazılamaz.

-- ---------------------------------------------------------
-- PARÇA 4: fis_bagla + harcama_sil (fiş yolunu döndürecek şekilde)
-- ---------------------------------------------------------

-- Yüklenen dosyayı harcamaya bağlar. Eski fişin yolunu döndürür (silinmesi için).
create or replace function public.fis_bagla(p_harcama_id uuid, p_yol text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben      uuid := auth.uid();
  v_grup_id  uuid;
  v_eski     text;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select group_id, fis_yolu into v_grup_id, v_eski
  from public.expenses where id = p_harcama_id;

  if v_grup_id is null or not public.grup_uyesi_mi(v_grup_id) then
    raise exception 'Harcama bulunamadı' using errcode = 'P0002';
  end if;

  -- Yetki + yolun bu harcamaya ait olması (aynı kural, tek yerde)
  if not public.fis_yuklenebilir_mi(p_yol)
     or p_yol not like v_grup_id::text || '/' || p_harcama_id::text || '/%' then
    raise exception 'Bu harcamaya fiş ekleyemezsin' using errcode = '42501';
  end if;

  -- Dosya gerçekten yüklenmiş olmalı
  if not exists (select 1 from storage.objects where bucket_id = 'fisler' and name = p_yol) then
    raise exception 'Fiş dosyası bulunamadı' using errcode = 'P0002';
  end if;

  update public.expenses set fis_yolu = p_yol where id = p_harcama_id;

  insert into public.expense_history (group_id, expense_id, islem, yapan_id, yeni)
  values (v_grup_id, p_harcama_id, 'fis_eklendi', v_ben, public.harcama_jsonu(p_harcama_id));

  return v_eski;
end;
$$;

revoke execute on function public.fis_bagla(uuid, text) from public, anon;
grant  execute on function public.fis_bagla(uuid, text) to authenticated;

-- harcama_sil artık silinen harcamanın fiş yolunu döndürüyor
-- (uygulama, harcamadan sonra dosyayı da Storage'dan silecek).
-- Dönüş türü değiştiği için önce eskisini kaldırıyoruz.
drop function public.harcama_sil(uuid);

create function public.harcama_sil(p_harcama_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ben        uuid := auth.uid();
  v_grup_id    uuid;
  v_olusturan  uuid;
  v_fis        text;
begin
  if v_ben is null then
    raise exception 'Giriş yapmalısın' using errcode = '28000';
  end if;

  select group_id, olusturan_id, fis_yolu into v_grup_id, v_olusturan, v_fis
  from public.expenses
  where id = p_harcama_id;

  if v_grup_id is null or not public.grup_uyesi_mi(v_grup_id) then
    raise exception 'Harcama bulunamadı' using errcode = 'P0002';
  end if;

  if v_ben is distinct from v_olusturan and not public.grup_yoneticisi_mi(v_grup_id) then
    raise exception 'Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi silebilir'
      using errcode = '42501';
  end if;

  insert into public.expense_history (group_id, expense_id, islem, yapan_id, eski)
  values (v_grup_id, p_harcama_id, 'silindi', v_ben, public.harcama_jsonu(p_harcama_id));

  delete from public.expenses where id = p_harcama_id;

  return v_fis;
end;
$$;

revoke execute on function public.harcama_sil(uuid) from public, anon;
grant  execute on function public.harcama_sil(uuid) to authenticated;
