-- GigTrack 1.3.0 — contas novas aguardam liberação de um administrador

-- 1) Flag de aprovação. Contas que já existem ficam liberadas; as novas nascem pendentes.
alter table public.profiles add column if not exists approved boolean not null default false;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists approved_by uuid references auth.users(id) on delete set null;
update public.profiles p set approved = true, approved_at = coalesce(approved_at, now())
 where p.approved = false
   and exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null);
update public.profiles set approved = true, approved_at = coalesce(approved_at, now())
 where id in (select user_id from public.app_admins);

-- 2) Ninguém se aprova sozinho: pela API o usuário só pode mexer em display_name e must_change_password.
revoke insert, update on table public.profiles from anon, authenticated;
grant  update (display_name, must_change_password) on table public.profiles to authenticated;
grant  insert (id, display_name) on table public.profiles to authenticated;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false)
      or exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- 3) Ações que exigem conta liberada
create or replace function public.create_band(p_name text)
returns public.bands
language plpgsql
security definer
set search_path = public
as $$
declare
  new_band public.bands;
begin
  if not public.is_approved() then
    raise exception 'Sua conta ainda aguarda liberação de um administrador.' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Nome da banda não pode ser vazio.';
  end if;
  insert into public.bands(name, created_by) values (p_name, auth.uid()) returning * into new_band;
  insert into public.band_members(band_id, user_id, role) values (new_band.id, auth.uid(), 'owner');
  return new_band;
end;
$$;

create or replace function public.join_band_with_code(p_code text)
returns public.bands
language plpgsql
security definer
set search_path = public
as $$
declare
  v_band_id uuid;
  result_band public.bands;
begin
  if not public.is_approved() then
    raise exception 'Sua conta ainda aguarda liberação de um administrador.' using errcode = '42501';
  end if;
  select band_id into v_band_id from public.band_invites where code = upper(trim(p_code));
  if v_band_id is null then
    raise exception 'Código de convite inválido.';
  end if;
  insert into public.band_members(band_id, user_id, role)
    values (v_band_id, auth.uid(), 'editor')
    on conflict (band_id, user_id) do nothing;
  select * into result_band from public.bands where id = v_band_id;
  return result_band;
end;
$$;

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
  if auth.uid() is null or not public.is_approved() then
    raise exception 'Sua conta ainda aguarda liberação de um administrador.' using errcode = '42501';
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

-- 4) Lista de usuários com a situação da conta
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (
  id uuid, email text, display_name text, created_at timestamptz, last_sign_in_at timestamptz,
  is_admin boolean, must_change_password boolean, band_count int, approved boolean
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
           (select count(*)::int from public.band_members m where m.user_id = u.id),
           coalesce(p.approved, false) and u.email_confirmed_at is not null
      from auth.users u
      left join public.profiles p on p.id = u.id
     order by (coalesce(p.approved, false) and u.email_confirmed_at is not null), u.created_at desc;
end;
$$;

-- 5) Liberar / bloquear conta (só admins)
create or replace function public.admin_set_approved(p_user_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Acesso restrito aos administradores.' using errcode = '42501';
  end if;
  if not p_approved and p_user_id = auth.uid() then
    raise exception 'Você não pode bloquear a sua própria conta.';
  end if;
  if not p_approved and exists (select 1 from public.app_admins where user_id = p_user_id) then
    raise exception 'Tire a pessoa do grupo de administradores antes de bloquear a conta.';
  end if;
  insert into public.profiles (id, display_name)
    select u.id, coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
      from auth.users u where u.id = p_user_id
    on conflict (id) do nothing;
  update public.profiles
     set approved = p_approved,
         approved_at = case when p_approved then now() else null end,
         approved_by = case when p_approved then auth.uid() else null end
   where id = p_user_id;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;
  if p_approved then
    update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = p_user_id;
  else
    delete from auth.sessions where user_id = p_user_id;
  end if;
end;
$$;

-- Ao tornar alguém admin, a conta também fica liberada
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
    update public.profiles set approved = true, approved_at = coalesce(approved_at, now()),
           approved_by = coalesce(approved_by, auth.uid()) where id = p_user_id;
    update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = p_user_id;
  else
    if p_user_id = auth.uid() then
      raise exception 'Você não pode remover a si mesmo do grupo de administradores.';
    end if;
    delete from public.app_admins where user_id = p_user_id;
  end if;
end;
$$;

revoke execute on function public.is_approved()                     from public, anon;
revoke execute on function public.admin_list_users()                from public, anon;
revoke execute on function public.admin_set_approved(uuid, boolean) from public, anon;
grant  execute on function public.is_approved()                     to authenticated;
grant  execute on function public.admin_list_users()                to authenticated;
grant  execute on function public.admin_set_approved(uuid, boolean) to authenticated;
