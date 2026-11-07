-- Migration: update_handle_new_user_oauth
-- Updates handle_new_user to extract Google OAuth full_name/name/picture and ensures username uniqueness

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  avatar text;
  suffix int;
begin
  -- 1. Determine base username from metadata (Google OAuth provides full_name or name; regular signup may provide username)
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1),
    'user'
  );

  -- 2. Ensure username uniqueness by appending numbers on conflict
  candidate_username := base_username;
  while exists (
    select 1 from public.profiles
    where lower(username) = lower(candidate_username)
      and id <> new.id
  ) loop
    suffix := floor(random() * 9000 + 1000)::int;
    candidate_username := base_username || suffix::text;
  end loop;

  -- 3. Determine avatar URL (Google OAuth provides 'picture', custom might provide 'avatar_url')
  avatar := coalesce(
    nullif(trim(new.raw_user_meta_data->>'picture'), ''),
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), '')
  );

  -- 4. Insert or update profile (role is strictly 'user' by default)
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    candidate_username,
    avatar,
    'user'
  )
  on conflict (id) do update set
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
