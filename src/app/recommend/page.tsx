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

  // 1. Fetch published anime with genres
  const { data: animeData, error } = await supabase
    .from('anime')
    .select('*, anime_genres(genres(*))')
    .eq('is_published', true)
    .order('score', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching recommendation anime:', error);
  }

  const allAnime = (animeData as Anime[]) || [];

  // 2. Fetch authenticated user's tracked anime if logged in
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
