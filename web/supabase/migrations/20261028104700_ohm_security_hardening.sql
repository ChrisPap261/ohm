-- Harden function search_path and revoke unintended EXECUTE on trigger helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.activate_season(p_season_id uuid)
returns public.seasons
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.seasons;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  update public.seasons
  set is_active = false
  where user_id = v_user and is_active = true and id <> p_season_id;

  update public.seasons
  set is_active = true
  where id = p_season_id and user_id = v_user
  returning * into v_row;

  if v_row.id is null then
    raise exception 'season not found';
  end if;

  return v_row;
end;
$$;

-- Trigger-only helper: not callable via PostgREST
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Keep email_for_username for login-by-username (intentional for anon)
revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- Project default helper if present
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
