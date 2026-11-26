-- GigTrack 1.4.0 — administrador cria usuários pelo próprio sistema
--
-- Aceita e-mail ou nome de usuário. Nome de usuário (sem "@") vira <usuario>@gigtrack.com.br,
-- o mesmo formato do login do app. A conta nasce liberada e com troca de senha obrigatória
-- no primeiro acesso.

create or replace function public.admin_create_user(
  p_login text,
  p_display_name text,
  p_password text,
  p_admin boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login text := lower(trim(coalesce(p_login, '')));
  v_email text;
  v_name  text := trim(coalesce(p_display_name, ''));
  v_id    uuid := gen_random_uuid();
begin
  if not public.is_app_admin() then
    raise exception 'Acesso restrito aos administradores.' using errcode = '42501';
  end if;

  if v_login = '' then
    raise exception 'Informe o e-mail ou o nome de usuário.';
  end if;
  if position('@' in v_login) > 0 then
    if v_login !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'E-mail inválido.';
    end if;
    v_email := v_login;
  else
    if v_login !~ '^[a-z0-9][a-z0-9._-]{2,30}$' then
      raise exception 'Nome de usuário inválido: use de 3 a 31 letras sem acento, números, ponto, hífen ou sublinhado.';
    end if;
    v_email := v_login || '@gigtrack.com.br';
  end if;

  if length(coalesce(p_password, '')) < 8 then
    raise exception 'A senha precisa ter pelo menos 8 caracteres.';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Já existe uma conta com esse e-mail ou usuário.';
  end if;
  if v_name = '' then
    v_name := split_part(v_email, '@', 1);
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', v_name), now(), now(),
    '', '', '', '', '', '', '', '', false, false
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());

  -- o gatilho handle_new_user já criou o perfil; libera e pede troca de senha
  insert into public.profiles (id, display_name) values (v_id, v_name) on conflict (id) do nothing;
  update public.profiles
     set display_name = v_name, approved = true, approved_at = now(), approved_by = auth.uid(),
         must_change_password = true
   where id = v_id;

  if p_admin then
    insert into public.app_admins (user_id, created_by) values (v_id, auth.uid()) on conflict do nothing;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.admin_create_user(text, text, text, boolean) from public, anon;
grant  execute on function public.admin_create_user(text, text, text, boolean) to authenticated;
