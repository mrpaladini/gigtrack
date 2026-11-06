-- GigTrack 1.2.0 — área administrativa, músicas públicas e cópia de músicas entre bandas

-- ------------------------------------------------------------------
-- 1) Músicas: pública, autoria e origem da cópia
-- ------------------------------------------------------------------
alter table public.songs add column if not exists is_public   boolean not null default false;
alter table public.songs add column if not exists created_by  uuid references auth.users(id) on delete set null default auth.uid();
alter table public.songs add column if not exists copied_from uuid references public.songs(id) on delete set null;
create index if not exists idx_songs_public on public.songs(name) where is_public;
comment on column public.songs.is_public   is 'Visível para todos os usuários logados na biblioteca de músicas públicas';
comment on column public.songs.copied_from is 'Música de onde esta foi copiada (outra banda ou biblioteca pública)';

-- ------------------------------------------------------------------
-- 2) Perfil: troca de senha obrigatória (depois de um reset pelo admin)
-- ------------------------------------------------------------------
alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- ------------------------------------------------------------------
-- 3) Grupo "admins" do site
--    Sem policies: ninguém lê/escreve direto pela API; só pelas funções abaixo.
-- ------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- Lista de usuários (só admins)
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, display_name text, created_at timestamptz, last_sign_in_at timestamptz,
  is_admin boolean, must_change_password boolean, band_count int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.is_app_admin() then
    raise exception 'Acesso restrito aos administradores.' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, coalesce(p.display_name, ''), u.created_at, u.last_sign_in_at,
           exists (select 1 from public.app_admins a where a.user_id = u.id),
           coalesce(p.must_change_password, false),
           (select count(*)::int from public.band_members m where m.user_id = u.id)
      from auth.users u
      left join public.profiles p on p.id = u.id
     order by u.created_at desc;
end;
$$;

-- Redefinir a senha de um usuário (só admins). A pessoa troca a senha no próximo login
-- e as sessões abertas dela são encerradas.
create or replace function public.admin_reset_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Acesso restrito aos administradores.' using errcode = '42501';
  end if;
  if length(coalesce(p_new_password, '')) < 8 then
    raise exception 'A senha precisa ter pelo menos 8 caracteres.';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = p_user_id;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;
  if p_user_id <> auth.uid() then
    update public.profiles set must_change_password = true where id = p_user_id;
    delete from auth.sessions where user_id = p_user_id;
  end if;
end;
$$;

-- Colocar/tirar alguém do grupo admins (só admins; ninguém tira a si mesmo)
create or replace function public.admin_set_admin(p_user_id uuid, p_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Acesso restrito aos administradores.' using errcode = '42501';
  end if;
  if p_admin then
    insert into public.app_admins(user_id, created_by) values (p_user_id, auth.uid())
      on conflict (user_id) do nothing;
  else
    if p_user_id = auth.uid() then
      raise exception 'Você não pode remover a si mesmo do grupo de administradores.';
    end if;
    delete from public.app_admins where user_id = p_user_id;
  end if;
end;
$$;

-- ------------------------------------------------------------------
-- 4) Biblioteca de músicas públicas (qualquer usuário logado)
-- ------------------------------------------------------------------
create or replace function public.list_public_songs(p_query text default '')
returns table (
  id uuid, name text, artist text, song_key text, duration_sec int,
  youtube_url text, spotify_url text, chord_source_url text,
  has_chords boolean, chord_key text, shared_by text, band_id uuid, band_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  q text := '%' || coalesce(trim(p_query), '') || '%';
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para ver as músicas públicas.' using errcode = '42501';
  end if;
  return query
    select s.id, s.name, coalesce(s.artist, ''), coalesce(s.song_key, ''), coalesce(s.duration_sec, 0),
           coalesce(s.youtube_url, ''), coalesce(s.spotify_url, ''), s.chord_source_url,
           (s.chord_sheet is not null and length(trim(s.chord_sheet)) > 0), s.chord_key,
           coalesce(p.display_name, ''), s.band_id, b.name
      from public.songs s
      join public.bands b on b.id = s.band_id
      left join public.profiles p on p.id = s.created_by
     where s.is_public
       and (s.name ilike q or coalesce(s.artist, '') ilike q)
     order by s.name, s.artist
     limit 300;
end;
$$;

-- ------------------------------------------------------------------
-- 5) Copiar uma música para outra banda
--    Permitido se você participa da banda de destino E (participa da banda de origem OU a música é pública).
--    Cópias de música pública não levam o comentário nem o arquivo anexado.
-- ------------------------------------------------------------------
create or replace function public.copy_song_to_band(p_song_id uuid, p_band_id uuid)
returns public.songs
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.songs;
  own boolean;
  new_row public.songs;
begin
  if not public.is_band_member(p_band_id) then
    raise exception 'Você não participa da banda de destino.' using errcode = '42501';
  end if;
  select * into src from public.songs where id = p_song_id;
  if not found then
    raise exception 'Música não encontrada.';
  end if;
  own := public.is_band_member(src.band_id);
  if not own and not src.is_public then
    raise exception 'Essa música não é pública.' using errcode = '42501';
  end if;
  if src.band_id = p_band_id then
    raise exception 'A música já está nessa banda.';
  end if;
  insert into public.songs (
    band_id, name, artist, song_key, duration_sec, youtube_url, spotify_url, comment,
    chord_sheet, chord_key, chord_source_url, chord_updated_at,
    sheet_path, sheet_name, is_public, created_by, copied_from
  ) values (
    p_band_id, src.name, src.artist, src.song_key, src.duration_sec, src.youtube_url, src.spotify_url,
    case when own then src.comment else '' end,
    src.chord_sheet, src.chord_key, src.chord_source_url, src.chord_updated_at,
    null, null, false, auth.uid(), src.id
  ) returning * into new_row;
  return new_row;
end;
$$;

-- ------------------------------------------------------------------
-- 6) Permissões: funções só para usuários logados
-- ------------------------------------------------------------------
revoke execute on function public.is_app_admin()                          from public, anon;
revoke execute on function public.admin_list_users()                      from public, anon;
revoke execute on function public.admin_reset_password(uuid, text)        from public, anon;
revoke execute on function public.admin_set_admin(uuid, boolean)          from public, anon;
revoke execute on function public.list_public_songs(text)                 from public, anon;
revoke execute on function public.copy_song_to_band(uuid, uuid)           from public, anon;
grant  execute on function public.is_app_admin()                          to authenticated;
grant  execute on function public.admin_list_users()                      to authenticated;
grant  execute on function public.admin_reset_password(uuid, text)        to authenticated;
grant  execute on function public.admin_set_admin(uuid, boolean)          to authenticated;
grant  execute on function public.list_public_songs(text)                 to authenticated;
grant  execute on function public.copy_song_to_band(uuid, uuid)           to authenticated;
