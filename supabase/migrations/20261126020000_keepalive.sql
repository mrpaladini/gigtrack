-- GigTrack 1.4.0 — acesso automático periódico (cron da Hostinger) para o projeto não ser pausado
--
-- O script cron/keepalive.php chama keepalive_ping() pela API, como um visitante do site.
-- A tabela tem uma linha só (não cresce) e ninguém lê/escreve nela direto pela API.

create table if not exists public.keepalive (
  id          int primary key default 1 check (id = 1),
  last_at     timestamptz not null default now(),
  last_source text not null default '',
  total       bigint not null default 0
);
alter table public.keepalive enable row level security;
revoke all on table public.keepalive from anon, authenticated;

create or replace function public.keepalive_ping(p_source text default 'cron')
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz := now();
begin
  insert into public.keepalive (id, last_at, last_source, total)
  values (1, v_at, left(coalesce(p_source, ''), 40), 1)
  on conflict (id) do update
    set last_at = excluded.last_at, last_source = excluded.last_source, total = public.keepalive.total + 1;
  -- uma leitura de verdade nas tabelas do app, como uma visita faria
  perform count(*) from public.songs;
  return v_at;
end;
$$;

-- Status para a área administrativa
create or replace function public.admin_keepalive_status()
returns table (last_at timestamptz, last_source text, total bigint)
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
  return query select k.last_at, k.last_source, k.total from public.keepalive k where k.id = 1;
end;
$$;

revoke execute on function public.keepalive_ping(text)        from public;
grant  execute on function public.keepalive_ping(text)        to anon, authenticated;
revoke execute on function public.admin_keepalive_status()    from public, anon;
grant  execute on function public.admin_keepalive_status()    to authenticated;
