-- =========================================================
-- Gün 7 / Bölüm 3 testi: harcama_duzenle + ortak pay fonksiyonu
--   * İlk 3 hesap: A yönetici, B ve C üye. Geçici 2 grup.
--   * EN SONDA bilerek hata fırlatır → HER ŞEY geri alınır.
-- =========================================================
do $$
declare
  a uuid; b uuid; c uuid;
  g1 uuid := gen_random_uuid();
  g2 uuid := gen_random_uuid();
  e1 uuid; e2 uuid; e3 uuid;
  durum text; n bigint; m bigint; metin text;
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
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  e1 := public.harcama_ekle(g1, 'Market', 10000, b, 'market', null, array[a, b, c]);
  e2 := public.harcama_ekle(g2, 'Gizli', 5000, b, 'market', null, array[b]);

  -- 1) Ortak fonksiyona taşınan harcama_ekle hâlâ doğru bölüyor mu? (100 ₺ / 3)
  select count(*), sum(pay_kurus), max(pay_kurus) into n, m, metin from public.expense_splits where expense_id = e1;
  rapor := rapor || E'\n' || case when n = 3 and m = 10000 and metin = '3334' then '✅' else '❌' end
        || ' 1) Ekleme: 3 kişi, toplam ' || m || ', en büyük pay ' || metin;

  -- 2) C (ekleyen değil, yönetici değil) düzenleyemez
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform public.harcama_duzenle(e1, 'Hile', 1, b, 'market', null, array[c]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 2) Başkasının harcamasını düzenlemek → ' || durum;

  -- 3) A, başka grubun harcamasını düzenleyemez (var olduğunu da öğrenemez)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin perform public.harcama_duzenle(e2, 'Hile', 1, a, 'market', null, array[a]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like 'P0002%' then '✅' else '❌' end || ' 3) Başka grubun harcaması → ' || durum;

  -- 4) B kendi harcamasını düzenler: 100,01 ₺, sadece A ve B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin perform public.harcama_duzenle(e1, '  Market (düzeltildi)  ', 10001, b, 'market', null, array[a, b, a]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  select count(*), sum(pay_kurus) into n, m from public.expense_splits where expense_id = e1;
  select aciklama into metin from public.expenses where id = e1;
  rapor := rapor || E'\n' || case when durum = 'DÜZENLENDİ' and n = 2 and m = 10001 and metin = 'Market (düzeltildi)' then '✅' else '❌' end
        || ' 4) Düzenleme: ' || n || ' kişi, paylar toplamı ' || m || ', açıklama "' || metin || '"';

  -- 5) Geçmişte eski ve yeni hal
  select (eski ->> 'tutar_kurus') || ' → ' || (yeni ->> 'tutar_kurus') into metin
  from public.expense_history where expense_id = e1 and islem = 'duzenlendi';
  rapor := rapor || E'\n' || case when metin = '10000 → 10001' then '✅' else '❌' end || ' 5) Geçmişte tutar değişimi → ' || coalesce(metin, 'yok');

  -- 6) Bakiyelerin toplamı hâlâ 0, C artık borçlu değil
  select coalesce(sum(net_kurus), 0) into m from public.grup_bakiyeleri(g1);
  select net_kurus into n from public.grup_bakiyeleri(g1) where uye_id = c;
  rapor := rapor || E'\n' || case when m = 0 and n = 0 then '✅' else '❌' end || ' 6) Düzenlemeden sonra toplam ' || m || ', C''nin bakiyesi ' || n;

  -- 7) Hiçbir şey değiştirmeden kaydetmek geçmişe kayıt eklemez
  perform public.harcama_duzenle(e1, 'Market (düzeltildi)', 10001, b, 'market', (select tarih from public.expenses where id = e1), array[a, b]);
  select count(*) into n from public.expense_history where expense_id = e1 and islem = 'duzenlendi';
  rapor := rapor || E'\n' || case when n = 1 then '✅' else '❌' end || ' 7) Değişiklik yoksa yeni kayıt yok → ' || n || ' düzenleme kaydı';

  -- 8–11) Geçersiz düzenlemeler
  begin perform public.harcama_duzenle(e1, 'x', 100, b, 'market', null, array[gen_random_uuid()]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '22023%' then '✅' else '❌' end || ' 8) Grupta olmayan kişi → ' || durum;

  begin perform public.harcama_duzenle(e1, 'x', 100, b, 'market', null, array[]::uuid[]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '22023%' then '✅' else '❌' end || ' 9) Kimse seçilmemiş → ' || durum;

  begin perform public.harcama_duzenle(e1, 'x', 100, b, 'market', current_date + 5, array[b]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '22023%' then '✅' else '❌' end || ' 10) İleri tarih → ' || durum;

  begin perform public.harcama_duzenle(e1, 'x', -100, b, 'market', null, array[b]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '23514%' then '✅' else '❌' end || ' 11) Negatif tutar → ' || left(durum, 60);

  -- 12) Yönetici (A), B'nin harcamasını düzenleyebilir
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin perform public.harcama_duzenle(e1, 'Market', 9000, b, 'market', null, array[a, b, c]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum = 'DÜZENLENDİ' then '✅' else '❌' end || ' 12) Yönetici düzenler → ' || durum;

  -- 13) Tabloyu doğrudan değiştirmek
  begin update public.expenses set tutar_kurus = 1 where id = e1; durum := 'GÜNCELLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 13) expenses doğrudan update → ' || left(durum, 60);

  -- 14) İç fonksiyonlar dışarıdan çağrılamaz
  begin perform public.paylari_yaz(e1, 1, array[a]); durum := 'ÇAĞRILDI';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 14) paylari_yaz doğrudan → ' || left(durum, 60);

  -- 15) Oturumsuz ve anonim
  perform set_config('request.jwt.claims', '{}', true);
  begin perform public.harcama_duzenle(e1, 'x', 1, b, 'market', null, array[b]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '28000%' then '✅' else '❌' end || ' 15) Oturumsuz → ' || durum;

  execute 'set local role anon';
  begin perform public.harcama_duzenle(e1, 'x', 1, b, 'market', null, array[b]); durum := 'DÜZENLENDİ';
  exception when others then durum := sqlstate || ' ' || sqlerrm; end;
  rapor := rapor || E'\n' || case when durum like '42501%' then '✅' else '❌' end || ' 16) Anonim → ' || left(durum, 60);

  raise exception using message = 'GÜN 7 DÜZENLEME TEST RAPORU (hiçbir şey kaydedilmedi, hepsi geri alındı):' || rapor;
end;
$$;
