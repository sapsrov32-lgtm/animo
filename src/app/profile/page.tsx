import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileWorkspace } from '@/components/profile/ProfileWorkspace';
import { UserProfile, UserAnime } from '@/types';

export const metadata: Metadata = {
  title: 'Моё аниме — Анимо',
  description: 'Личные списки аниме, отслеживание серий, персональная статистика и карточка «Мой год в аниме».',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile');
  }

  // 1. Fetch user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profile: UserProfile = profileData || {
    id: user.id,
    username: user.email?.split('@')[0] || 'Пользователь',
    avatar_url: null,
    role: 'user',
    created_at: new Date().toISOString(),
  };

  // 2. Fetch user's anime list with joined anime and genres
  const { data: userAnimeData, error } = await supabase
    .from('user_anime')
    .select(`
      id,
      user_id,
      anime_id,
      status,
      score,
      progress,
      updated_at,
      anime:anime(
        id,
        slug,
        title_ru,
        title_en,
        title_jp,
        format,
        episodes,
        poster_url,
        score,
        year,
        status,
        anime_genres(genres(*))
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user anime:', error);
  }

  const initialItems: UserAnime[] = (userAnimeData as any) || [];

  return <ProfileWorkspace profile={profile} initialItems={initialItems} />;
}
