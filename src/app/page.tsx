import { createClient } from '@/lib/supabase/server';
import { HomeView } from '@/components/home/HomeView';
import { HERO_ANIME, POPULAR_ANIME, SEASON_ANIME } from '@/data/mockAnime';
import { Anime } from '@/types';

export const revalidate = 60; // Cache for 60 seconds

export default async function HomePage() {
  const supabase = await createClient();

  const MAIN_FORMATS = ['ТВ Сериал', 'Фильм', 'OVA', 'ONA'];

  // Fetch real anime from Supabase
  const [
    { data: topAnimeList },
    { data: popularData },
    { data: ongoingData },
    { data: seasonalData },
  ] = await Promise.all([
    // Hero Anime: Masterpiece TV series or major movie with verified poster
    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .in('status', ['finished', 'ongoing'])
      .in('format', MAIN_FORMATS)
      .not('poster_url', 'is', null)
      .or('episodes.gte.4,format.eq.Фильм')
      .lte('score', 9.5)
      .gte('score', 8.5)
      .order('score', { ascending: false, nullsFirst: false })
      .limit(1),

    // Popular Now: Top released masterworks
    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .in('status', ['finished', 'ongoing'])
      .in('format', MAIN_FORMATS)
      .not('poster_url', 'is', null)
      .or('episodes.gte.3,format.eq.Фильм')
      .lte('score', 9.5)
      .gte('score', 8.0)
      .order('score', { ascending: false, nullsFirst: false })
      .range(1, 15),

    // Ongoing: Currently airing series with active releases (next 7 days prioritized)
    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .eq('status', 'ongoing')
      .in('format', MAIN_FORMATS)
      .not('poster_url', 'is', null)
      .order('next_episode_at', { ascending: true, nullsFirst: false })
      .limit(12),

    // Seasonal: Hits of recent years
    supabase
      .from('anime')
      .select('*, anime_genres(genres(*))')
      .eq('is_published', true)
      .in('status', ['finished', 'ongoing'])
      .in('format', MAIN_FORMATS)
      .not('poster_url', 'is', null)
      .gte('year', 2022)
      .lte('score', 9.5)
      .order('year', { ascending: false, nullsFirst: false })
      .order('score', { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  const heroAnime = (topAnimeList?.[0] as Anime) || HERO_ANIME;
  const popularAnime =
    popularData && popularData.length > 0 ? (popularData as Anime[]) : POPULAR_ANIME;
  const ongoingAnime = (ongoingData as Anime[]) || [];
  const seasonalAnime =
    seasonalData && seasonalData.length > 0 ? (seasonalData as Anime[]) : SEASON_ANIME;

  return (
    <HomeView
      heroAnime={heroAnime}
      popularAnime={popularAnime}
      ongoingAnime={ongoingAnime}
      seasonalAnime={seasonalAnime}
    />
  );
}
