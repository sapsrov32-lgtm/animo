import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PublicProfileWorkspace } from '@/components/profile/PublicProfileWorkspace';
import { UserProfile, UserAnime } from '@/types';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  return {
    title: `Профиль @${decoded} — списки и статистика аниме`,
    description: `Публичный аниме-трекер, список просмотренного, любимые жанры и персональные оценки пользователя @${decoded} на Анимо.`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const admin = createAdminClient();

  // Find user by username (case-insensitive)
  const { data: profileData } = await admin
    .from('profiles')
    .select('*')
    .ilike('username', decoded)
    .maybeSingle();

  if (!profileData) {
    notFound();
  }

  const profile: UserProfile = profileData;

  // Fetch their public anime list
  const { data: userAnimeData, error } = await admin
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
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching public user anime:', error);
  }

  const items: UserAnime[] = (userAnimeData as any) || [];

  return <PublicProfileWorkspace profile={profile} items={items} />;
}
