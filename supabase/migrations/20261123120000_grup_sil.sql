create or replace function public.grup_sil(p_grup_id uuid)
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
    raise exception 'Grubu sadece yönetici silebilir' using errcode = '42501';
  end if;

  delete from public.groups where id = p_grup_id;
end;
$$;

revoke execute on function public.grup_sil(uuid) from public, anon;
grant  execute on function public.grup_sil(uuid) to authenticated;
