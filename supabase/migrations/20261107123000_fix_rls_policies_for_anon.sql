-- Migration: fix_rls_policies_for_anon
-- Separates SELECT policy on anime into public (is_published = true) and staff (to authenticated)
-- Ensures anon does not need EXECUTE permission on is_staff()

do $$
begin
  -- 1. Anime SELECT policies
  if exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Anyone can view published anime or staff can view all') then
    drop policy "Anyone can view published anime or staff can view all" on public.anime;
  end if;

  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Anyone can view published anime') then
    create policy "Anyone can view published anime"
      on public.anime for select
      using (is_published = true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can view all anime') then
    create policy "Staff can view all anime"
      on public.anime for select
      to authenticated
      using (public.is_staff());
  end if;

  -- 2. Staff write policies on anime
  if exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can insert anime') then
    drop policy "Staff can insert anime" on public.anime;
  end if;
  create policy "Staff can insert anime" on public.anime for insert to authenticated with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can update anime') then
    drop policy "Staff can update anime" on public.anime;
  end if;
  create policy "Staff can update anime" on public.anime for update to authenticated using (public.is_staff()) with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can delete anime') then
    drop policy "Staff can delete anime" on public.anime;
  end if;
  create policy "Staff can delete anime" on public.anime for delete to authenticated using (public.is_staff());

  -- 3. Staff write policies on genres
  if exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can insert genres') then
    drop policy "Staff can insert genres" on public.genres;
  end if;
  create policy "Staff can insert genres" on public.genres for insert to authenticated with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can update genres') then
    drop policy "Staff can update genres" on public.genres;
  end if;
  create policy "Staff can update genres" on public.genres for update to authenticated using (public.is_staff()) with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can delete genres') then
    drop policy "Staff can delete genres" on public.genres;
  end if;
  create policy "Staff can delete genres" on public.genres for delete to authenticated using (public.is_staff());

  -- 4. Staff write policies on anime_genres
  if exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can insert anime_genres') then
    drop policy "Staff can insert anime_genres" on public.anime_genres;
  end if;
  create policy "Staff can insert anime_genres" on public.anime_genres for insert to authenticated with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can update anime_genres') then
    drop policy "Staff can update anime_genres" on public.anime_genres;
  end if;
  create policy "Staff can update anime_genres" on public.anime_genres for update to authenticated using (public.is_staff()) with check (public.is_staff());

  if exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can delete anime_genres') then
    drop policy "Staff can delete anime_genres" on public.anime_genres;
  end if;
  create policy "Staff can delete anime_genres" on public.anime_genres for delete to authenticated using (public.is_staff());
end $$;
