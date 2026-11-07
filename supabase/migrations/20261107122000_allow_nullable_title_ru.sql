-- Migration: allow_nullable_title_ru
-- Allows title_ru to be nullable when importing foreign datasets (with title_en / title_jp fallbacks)
alter table public.anime alter column title_ru drop not null;
