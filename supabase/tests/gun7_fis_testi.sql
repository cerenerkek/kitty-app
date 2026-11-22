-- =========================================================
-- Gün 7 / Bölüm 2 testi: fiş klasörü güvenlik kuralları + fis_bagla
--   * İlk 3 hesap: A yönetici, B ve C üye. Geçici 2 grup.
--   * storage.objects tablosuna doğrudan satır ekleyerek "yükleme"
--     kuralını dener (dosyanın kendisi yok, sadece kural testi).
--   * EN SONDA bilerek hata fırlatır → HER ŞEY geri alınır.
-- =========================================================
do $$
declare
  a uuid; b uuid; c uuid;
  g1 uuid := gen_random_uuid();   -- A (yönetici), B, C
  g2 uuid := gen_random_uuid();   -- sadece B
  e1 uuid; e2 uuid;
  yol_b text; yol_a text;
  durum text; n bigint; metin text;
  rapor text := '';
begin
  select id into a from public.profiles order by created_at limit 1;
  select id into b from public.profiles where id <> a order by created_at limit 1;
  select id into c from public.profiles where id not in (a, b) order by created_at limit 1;
  if c is null then raise exception 'Bu test için en az 3 hesap gerekli'; end if;

  insert into public.groups (id, ad, olusturan_id) values (g1, 'TEST ortak', a), (g2, 'TEST sadece B', b);
  insert into public.group_members (group_id, user_id, rol)
  values (g1, a, 'admin'), (g1, b, 'uye'), (g1, c, 'uye'), (g2, b, 'admin');

  execute 'set local role authenticated';

  -- B: G1'e e1, G2'ye e2 ekler
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  e1 := public.harcama_ekle(g1, 'Market', 30000, b, 'market', null, array[a, b, c]);
  e2 := public.harcama_ekle(g2, 'Gizli', 5000, b, 'market', null, array[b]);
  yol_b := g1 || '/' || e1 || '/b.jpg';
  yol_a := g1 || '/' || e1 || '/a.jpg';

  -- 1) B, kendi harcamasına fiş yükleyebilir
  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', yol_b, b::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum = 'YÜKLENDİ' then '✅' else '❌' end || ' 1) Ekleyen kendi harcamasına yükler → ' || durum;

  -- 2) C (ekleyen değil, yönetici değil) yükleyemez
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', g1 || '/' || e1 || '/c.jpg', c::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 2) Başkasının harcamasına yüklemek → ' || left(durum, 70);

  -- 3) C, B'nin fişini GÖREBİLİR (aynı grubun üyesi)
  select count(*) into n from storage.objects where bucket_id = 'fisler' and name = yol_b;
  rapor := rapor || E'\n' || case when n = 1 then '✅' else '❌' end || ' 3) Grup üyesi fişi görür → ' || n;

  -- 4) A yönetici: B'nin harcamasına yükleyebilir
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', yol_a, a::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum = 'YÜKLENDİ' then '✅' else '❌' end || ' 4) Yönetici yükler → ' || durum;

  -- 5) A, üyesi olmadığı grubun klasörüne yükleyemez
  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', g2 || '/' || e2 || '/a.jpg', a::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 5) Başka grubun klasörüne yüklemek → ' || left(durum, 70);

  -- 6) A, başka grubun fişlerini göremez
  select count(*) into n from storage.objects where bucket_id = 'fisler' and name like g2 || '/%';
  rapor := rapor || E'\n' || case when n = 0 then '✅' else '❌' end || ' 6) Başka grubun fişleri görünmez → ' || n;

  -- 7) Bozuk yol ve "grup ile harcama uyuşmuyor" hileleri
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', g1 || '/bozuk.jpg', b::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 7) Bozuk yol → ' || left(durum, 70);

  begin insert into storage.objects (bucket_id, name, owner_id) values ('fisler', g1 || '/' || e2 || '/x.jpg', b::text); durum := 'YÜKLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 8) G1 klasörüne G2 harcaması → ' || left(durum, 70);

  -- 9) fis_bagla: B kendi fişini bağlar → harcamada yol + geçmişte kayıt
  begin perform public.fis_bagla(e1, yol_b); durum := 'BAĞLANDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  select fis_yolu into metin from public.expenses where id = e1;
  select count(*) into n from public.expense_history where expense_id = e1 and islem = 'fis_eklendi';
  rapor := rapor || E'\n' || case when durum = 'BAĞLANDI' and metin = yol_b and n = 1 then '✅' else '❌' end
        || ' 9) Fiş bağlandı → ' || durum || ', geçmiş kaydı ' || n;

  -- 10) Var olmayan dosyayı bağlamak
  begin perform public.fis_bagla(e1, g1 || '/' || e1 || '/yok.jpg'); durum := 'BAĞLANDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like 'P0002%' then '✅' else '❌' end || ' 10) Olmayan dosyayı bağlamak → ' || durum;

  -- 11) Başka harcamanın yolunu bağlamak
  begin perform public.fis_bagla(e2, yol_b); durum := 'BAĞLANDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 11) Yanlış harcamaya bağlamak → ' || durum;

  -- 12) C, fiş bağlayamaz (yetkisi yok)
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform public.fis_bagla(e1, yol_b); durum := 'BAĞLANDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 12) Yetkisiz bağlama → ' || durum;

  -- 13) harcama_sil fiş yolunu döndürür (uygulama dosyayı silebilsin)
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin metin := public.harcama_sil(e1); durum := 'SİLİNDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; metin := null; end;
  rapor := rapor || E'\n' || case when durum = 'SİLİNDİ' and metin = yol_b then '✅' else '❌' end
        || ' 13) Silme fiş yolunu döndürür → ' || durum;

  -- 14) Anonim: fiş klasöründe hiçbir şey göremez
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin select count(*) into n from storage.objects where bucket_id = 'fisler'; durum := 'GÖRÜLEN ' || n;
  exception when others then durum := sqlstate || ' ' || sqlerrm; n := 0; end;
  rapor := rapor || E'\n' || case when n = 0 then '✅' else '❌' end || ' 14) Anonim fişleri göremez → ' || left(durum, 60);

  begin perform public.fis_bagla(e1, yol_b); durum := 'BAĞLANDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 15) Anonim fis_bagla → ' || left(durum, 60);

  raise exception using message = 'GÜN 7 FİŞ TEST RAPORU (hiçbir şey kaydedilmedi, hepsi geri alındı):' || rapor;
end;
$$;
