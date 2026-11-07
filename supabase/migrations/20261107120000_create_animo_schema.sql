-- Migration: create_animo_schema
-- Creates tables: profiles, anime, genres, anime_genres, user_anime
-- Sets up RLS, staff/admin helper functions, auth triggers, indexes, and posters storage bucket

create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('editor', 'admin')
  );
$$;

create or replace function public.handle_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_profile_update_protect_role') then
    create trigger on_profile_update_protect_role
      before update on public.profiles
      for each row
      execute function public.handle_profile_update();
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end $$;

create table if not exists public.anime (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text,
  title_jp text,
  description text,
  year integer,
  season text,
  status text not null default 'ongoing' check (status in ('ongoing', 'finished', 'announced')),
  format text,
  episodes integer,
  poster_url text,
  banner_url text,
  anilist_id integer unique,
  airing_day text check (airing_day in ('пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс')),
  next_episode_at timestamptz,
  score numeric(4, 2),
  studio text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name_ru text not null,
  slug text unique not null
);

create table if not exists public.anime_genres (
  anime_id uuid not null references public.anime(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (anime_id, genre_id)
);

create table if not exists public.user_anime (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id uuid not null references public.anime(id) on delete cascade,
  status text not null check (status in ('plan', 'now', 'done')),
  score integer check (score is null or (score >= 1 and score <= 10)),
  progress integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, anime_id)
);

alter table public.profiles enable row level security;
alter table public.anime enable row level security;
alter table public.genres enable row level security;
alter table public.anime_genres enable row level security;
alter table public.user_anime enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Public can view profiles') then
    create policy "Public can view profiles" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Anyone can view published anime or staff can view all') then
    create policy "Anyone can view published anime or staff can view all" on public.anime for select using (is_published = true or public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can insert anime') then
    create policy "Staff can insert anime" on public.anime for insert with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can update anime') then
    create policy "Staff can update anime" on public.anime for update using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime' and policyname = 'Staff can delete anime') then
    create policy "Staff can delete anime" on public.anime for delete using (public.is_staff());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Anyone can view genres') then
    create policy "Anyone can view genres" on public.genres for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can insert genres') then
    create policy "Staff can insert genres" on public.genres for insert with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can update genres') then
    create policy "Staff can update genres" on public.genres for update using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'genres' and policyname = 'Staff can delete genres') then
    create policy "Staff can delete genres" on public.genres for delete using (public.is_staff());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Anyone can view anime_genres') then
    create policy "Anyone can view anime_genres" on public.anime_genres for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can insert anime_genres') then
    create policy "Staff can insert anime_genres" on public.anime_genres for insert with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can update anime_genres') then
    create policy "Staff can update anime_genres" on public.anime_genres for update using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'anime_genres' and policyname = 'Staff can delete anime_genres') then
    create policy "Staff can delete anime_genres" on public.anime_genres for delete using (public.is_staff());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'user_anime' and policyname = 'Users can view own user_anime') then
    create policy "Users can view own user_anime" on public.user_anime for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_anime' and policyname = 'Users can insert own user_anime') then
    create policy "Users can insert own user_anime" on public.user_anime for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_anime' and policyname = 'Users can update own user_anime') then
    create policy "Users can update own user_anime" on public.user_anime for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_anime' and policyname = 'Users can delete own user_anime') then
    create policy "Users can delete own user_anime" on public.user_anime for delete using (user_id = auth.uid());
  end if;
end $$;

create index if not exists idx_anime_slug on public.anime(slug);
create index if not exists idx_anime_year on public.anime(year);
create index if not exists idx_anime_status on public.anime(status);
create index if not exists idx_anime_is_published on public.anime(is_published);
create index if not exists idx_anime_anilist_id on public.anime(anilist_id);
create index if not exists idx_genres_slug on public.genres(slug);
create index if not exists idx_user_anime_user_id on public.user_anime(user_id);
create index if not exists idx_user_anime_anime_id on public.user_anime(anime_id);
create index if not exists idx_user_anime_status on public.user_anime(status);

create index if not exists idx_anime_title_ru_trgm on public.anime using gin (title_ru gin_trgm_ops);
create index if not exists idx_anime_title_en_trgm on public.anime using gin (title_en gin_trgm_ops);

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read access for posters bucket') then
    create policy "Public read access for posters bucket" on storage.objects for select using (bucket_id = 'posters');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Staff insert access for posters bucket') then
    create policy "Staff insert access for posters bucket" on storage.objects for insert to authenticated with check (bucket_id = 'posters' and public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Staff update access for posters bucket') then
    create policy "Staff update access for posters bucket" on storage.objects for update to authenticated using (bucket_id = 'posters' and public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Staff delete access for posters bucket') then
    create policy "Staff delete access for posters bucket" on storage.objects for delete to authenticated using (bucket_id = 'posters' and public.is_staff());
  end if;
end $$;
