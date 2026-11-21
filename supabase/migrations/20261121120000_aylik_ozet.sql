-- =========================================================
-- Gün 5: Aylık kategori özeti
-- Bir grubun seçilen aydaki harcamaları, kategori başına:
--   toplam_kurus       → grubun o kategorideki toplam harcaması
--   benim_payim_kurus  → bu harcamalardaki BENİM payımın toplamı
--   adet               → kaç harcama
-- Ödemeler (settlements) dahil DEĞİL: onlar harcama değil, borç kapatma.
-- =========================================================
create or replace function public.aylik_ozet(p_grup_id uuid, p_ay date)
returns table (
  kategori           text,
  toplam_kurus       bigint,
  benim_payim_kurus  bigint,
  adet               bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.kategori,
    sum(e.tutar_kurus)::bigint,
    coalesce(sum(s.pay_kurus), 0)::bigint,
    count(*)::bigint
  from public.expenses e
  -- Her harcamaya SADECE benim pay satırımı ekle (yoksa null)
  left join public.expense_splits s
    on s.expense_id = e.id
   and s.user_id = (select auth.uid())
  where e.group_id = p_grup_id
    -- Ayın 1'i dahil, sonraki ayın 1'i hariç
    and e.tarih >= date_trunc('month', p_ay)::date
    and e.tarih <  (date_trunc('month', p_ay) + interval '1 month')::date
  group by e.kategori
  order by 2 desc;
$$;

revoke execute on function public.aylik_ozet(uuid, date) from public, anon;
grant  execute on function public.aylik_ozet(uuid, date) to authenticated;