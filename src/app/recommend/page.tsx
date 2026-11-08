import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { RecommendWorkspace } from '@/components/recommend/RecommendWorkspace';
import { Anime } from '@/types';

export const metadata: Metadata = {
  title: 'Что посмотреть? Интеллектуальный компас — Анимо',
  description:
    'Умный алгоритм персонального подбора аниме по 3 простым критериям: настроение, доступное время и желаемый сеттинг.',
};

export const revalidate = 300; // cache for 5 minutes

export default async function RecommendPage() {
  const supabase = await createClient();

  // Fetch top anime with genres for recommendation scoring (excluding 18+)
  const { data: animeData, error } = await supabase
    .from('anime')
    .select('*, anime_genres(genres(*))')
    .eq('is_published', true)
    .eq('is_adult', false)
    .not('poster_url', 'is', null)
    .in('format', ['ТВ Сериал', 'Фильм', 'OVA', 'ONA'])
    .gte('score', 6.5)
    .order('popularity', { ascending: false, nullsFirst: false })
    .limit(1500);

  if (error) {
    console.error('Error fetching recommendation anime:', error);
  }

  const allAnime = ((animeData as Anime[]) || []).filter((a) => {
    const gSlugs = a.anime_genres?.map((ag: any) => ag.genres?.slug?.toLowerCase()) || [];
    return !gSlugs.includes('hentai') && !gSlugs.includes('ecchi');
  });

  // Fetch user list if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userAnimeMap: Record<string, string> = {};

  if (user) {
    const { data: userAnimeData } = await supabase
      .from('user_anime')
      .select('anime_id, status')
      .eq('user_id', user.id);

    if (userAnimeData) {
      userAnimeData.forEach((record) => {
        userAnimeMap[record.anime_id] = record.status;
      });
    }
  }

  return (
    <RecommendWorkspace
      allAnime={allAnime}
      userAnimeMap={userAnimeMap}
      isLoggedIn={Boolean(user)}
    />
  );
}
