import { createClient } from '@/lib/supabase/server';
import { HomeView } from '@/components/home/HomeView';
import { HERO_ANIME, POPULAR_ANIME, SEASON_ANIME } from '@/data/mockAnime';
import { Anime } from '@/types';

export const revalidate = 60; // Cache for 60 seconds

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch real anime from Supabase using anon key
  const [
    { data: topAnimeList },
    { data: popularData },
    { data: ongoingData },
    { data: seasonalData },
  ] = await Promise.all([
    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .order('score', { ascending: false, nullsFirst: false })
      .limit(1),

    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .order('score', { ascending: false, nullsFirst: false })
      .range(1, 12),

    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .eq('status', 'ongoing')
      .order('score', { ascending: false, nullsFirst: false })
      .limit(6),

    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .order('year', { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  const heroAnime = (topAnimeList?.[0] as Anime) || HERO_ANIME;
  const popularAnime = (popularData && popularData.length > 0)
    ? (popularData as Anime[])
    : POPULAR_ANIME;
  const ongoingAnime = (ongoingData as Anime[]) || [];
  const seasonalAnime = (seasonalData && seasonalData.length > 0)
    ? (seasonalData as Anime[])
    : SEASON_ANIME;

  return (
    <HomeView
      heroAnime={heroAnime}
      popularAnime={popularAnime}
      ongoingAnime={ongoingAnime}
      seasonalAnime={seasonalAnime}
    />
  );
}
