import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CalendarWorkspace } from '@/components/calendar/CalendarWorkspace';
import { Anime } from '@/types';

export const metadata: Metadata = {
  title: 'Календарь выхода серий — Анимо',
  description:
    'Точное интерактивное расписание выхода серий аниме-онгоингов по дням недели с автоматическим пересчётом на местное время зрителя.',
};

export const revalidate = 60; // revalidate every minute

export default async function CalendarPage() {
  const supabase = await createClient();

  // 1. Fetch all ongoing and scheduled anime
  const { data: ongoingData, error } = await supabase
    .from('anime')
    .select('*, anime_genres(genres(*))')
    .eq('is_published', true)
    .or('status.eq.ongoing,airing_day.not.is.null,next_episode_at.not.is.null')
    .order('next_episode_at', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching calendar anime:', error);
  }

  const animeList = (ongoingData as Anime[]) || [];

  // 2. Fetch authenticated user's tracked anime if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userAnimeMap: Record<string, { status: string; progress: number }> = {};

  if (user) {
    const { data: userAnimeData } = await supabase
      .from('user_anime')
      .select('anime_id, status, progress')
      .eq('user_id', user.id);

    if (userAnimeData) {
      userAnimeData.forEach((record) => {
        userAnimeMap[record.anime_id] = {
          status: record.status,
          progress: record.progress,
        };
      });
    }
  }

  return (
    <CalendarWorkspace
      animeList={animeList}
      userAnimeMap={userAnimeMap}
      isLoggedIn={Boolean(user)}
    />
  );
}
