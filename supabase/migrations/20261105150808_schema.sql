-- GigTrack — esquema principal (tabelas, funções, RLS e storage)
-- Já aplicado no projeto Supabase "backline" (ttaxdkoaecxomsagnoxu). Guardado aqui para histórico
-- e para recriar o banco do zero, se um dia for preciso.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.band_members (
  band_id uuid not null references public.bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor')),
  joined_at timestamptz not null default now(),
  primary key (band_id, user_id)
);

create table if not exists public.band_invites (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  name text not null,
  artist text default '',
  song_key text default '',
  duration_sec int default 0,
  youtube_url text default '',
  spotify_url text default '',
  sheet_path text,
  sheet_name text,
  comment text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  name text not null,
  venue text default '',
  show_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.show_songs (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position int not null default 0
);

create index if not exists idx_band_members_user on public.band_members(user_id);
create index if not exists idx_songs_band on public.songs(band_id);
create index if not exists idx_shows_band on public.shows(band_id);
create index if not exists idx_show_songs_show on public.show_songs(show_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists songs_touch_updated_at on public.songs;
create trigger songs_touch_updated_at before update on public.songs
  for each row execute function public.touch_updated_at();

drop trigger if exists shows_touch_updated_at on public.shows;
create trigger shows_touch_updated_at before update on public.shows
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_band_member(p_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.band_members
    where band_id = p_band_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_show_band_member(p_show_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shows s
    join public.band_members m on m.band_id = s.band_id
    where s.id = p_show_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.create_band(p_name text)
returns public.bands
language plpgsql
security definer
set search_path = public
as $$
declare
  new_band public.bands;
begin
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

create or replace function public.create_invite_code(p_band_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_band_member(p_band_id) then
    raise exception 'Você não participa dessa banda.';
  end if;
  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  insert into public.band_invites(band_id, code, created_by) values (p_band_id, v_code, auth.uid());
  return v_code;
end;
$$;

alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.band_members enable row level security;
alter table public.band_invites enable row level security;
alter table public.songs enable row level security;
alter table public.shows enable row level security;
alter table public.show_songs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
drop policy if exists "profiles_select_bandmates" on public.profiles;
create policy "profiles_select_bandmates" on public.profiles for select using (
  exists (
    select 1 from public.band_members m1
    join public.band_members m2 on m1.band_id = m2.band_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id
  )
);

drop policy if exists "bands_select_member" on public.bands;
create policy "bands_select_member" on public.bands for select using (public.is_band_member(id));
drop policy if exists "bands_update_member" on public.bands;
create policy "bands_update_member" on public.bands for update using (public.is_band_member(id));
drop policy if exists "bands_delete_owner" on public.bands;
create policy "bands_delete_owner" on public.bands for delete using (
  exists(select 1 from public.band_members m where m.band_id = id and m.user_id = auth.uid() and m.role = 'owner')
);

drop policy if exists "band_members_select" on public.band_members;
create policy "band_members_select" on public.band_members for select using (public.is_band_member(band_id));
drop policy if exists "band_members_delete_owner" on public.band_members;
create policy "band_members_delete_owner" on public.band_members for delete using (
  exists(select 1 from public.band_members m2 where m2.band_id = band_members.band_id and m2.user_id = auth.uid() and m2.role = 'owner')
);
drop policy if exists "band_members_delete_self" on public.band_members;
create policy "band_members_delete_self" on public.band_members for delete using (user_id = auth.uid());

drop policy if exists "band_invites_select_member" on public.band_invites;
create policy "band_invites_select_member" on public.band_invites for select using (public.is_band_member(band_id));

drop policy if exists "songs_select_member" on public.songs;
create policy "songs_select_member" on public.songs for select using (public.is_band_member(band_id));
drop policy if exists "songs_insert_member" on public.songs;
create policy "songs_insert_member" on public.songs for insert with check (public.is_band_member(band_id));
drop policy if exists "songs_update_member" on public.songs;
create policy "songs_update_member" on public.songs for update using (public.is_band_member(band_id));
drop policy if exists "songs_delete_member" on public.songs;
create policy "songs_delete_member" on public.songs for delete using (public.is_band_member(band_id));

drop policy if exists "shows_select_member" on public.shows;
create policy "shows_select_member" on public.shows for select using (public.is_band_member(band_id));
drop policy if exists "shows_insert_member" on public.shows;
create policy "shows_insert_member" on public.shows for insert with check (public.is_band_member(band_id));
drop policy if exists "shows_update_member" on public.shows;
create policy "shows_update_member" on public.shows for update using (public.is_band_member(band_id));
drop policy if exists "shows_delete_member" on public.shows;
create policy "shows_delete_member" on public.shows for delete using (public.is_band_member(band_id));

drop policy if exists "show_songs_select" on public.show_songs;
create policy "show_songs_select" on public.show_songs for select using (public.is_show_band_member(show_id));
drop policy if exists "show_songs_insert" on public.show_songs;
create policy "show_songs_insert" on public.show_songs for insert with check (public.is_show_band_member(show_id));
drop policy if exists "show_songs_update" on public.show_songs;
create policy "show_songs_update" on public.show_songs for update using (public.is_show_band_member(show_id));
drop policy if exists "show_songs_delete" on public.show_songs;
create policy "show_songs_delete" on public.show_songs for delete using (public.is_show_band_member(show_id));

insert into storage.buckets (id, name, public)
values ('band-files', 'band-files', false)
on conflict (id) do nothing;

drop policy if exists "band_files_select" on storage.objects;
create policy "band_files_select" on storage.objects for select using (
  bucket_id = 'band-files' and public.is_band_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists "band_files_insert" on storage.objects;
create policy "band_files_insert" on storage.objects for insert with check (
  bucket_id = 'band-files' and public.is_band_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists "band_files_update" on storage.objects;
create policy "band_files_update" on storage.objects for update using (
  bucket_id = 'band-files' and public.is_band_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists "band_files_delete" on storage.objects;
create policy "band_files_delete" on storage.objects for delete using (
  bucket_id = 'band-files' and public.is_band_member((storage.foldername(name))[1]::uuid)
);
