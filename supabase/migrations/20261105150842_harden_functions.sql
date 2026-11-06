-- GigTrack — permissões das funções (já aplicado)
alter function public.touch_updated_at() set search_path = public;

-- funções do app: só usuários logados
revoke execute on function public.create_band(text) from public, anon;
revoke execute on function public.join_band_with_code(text) from public, anon;
revoke execute on function public.create_invite_code(uuid) from public, anon;
revoke execute on function public.is_band_member(uuid) from public, anon;
revoke execute on function public.is_show_band_member(uuid) from public, anon;
grant execute on function public.create_band(text) to authenticated;
grant execute on function public.join_band_with_code(text) to authenticated;
grant execute on function public.create_invite_code(uuid) to authenticated;
grant execute on function public.is_band_member(uuid) to authenticated;
grant execute on function public.is_show_band_member(uuid) to authenticated;

-- gatilho de cadastro: ninguém chama pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
