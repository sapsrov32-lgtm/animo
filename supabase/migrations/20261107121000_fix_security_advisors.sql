-- Migration: fix_security_advisors
-- 1. Move pg_trgm extension to extensions schema to satisfy extension_in_public lint
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- 2. Revoke execute on trigger functions from public/anon/authenticated (triggers run with function definer / internal)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_profile_update() from public, anon, authenticated;

-- 3. Revoke execute on is_admin and is_staff from anon and public (only authenticated staff need to invoke)
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- 4. Update anime policy so anon only checks is_published and doesn't call is_staff
do $$
begin
  if exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Anyone can view published anime or staff can view all') then
    alter policy "Anyone can view published anime or staff can view all" on public.anime
      using (is_published = true or (auth.role() = 'authenticated' and public.is_staff()));
  end if;
end $$;
