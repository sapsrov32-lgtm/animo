import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';
import { Anime, Genre } from '@/types';

export const metadata: Metadata = {
  title: 'Админ-панель — Управление каталогом | Анимо',
  description: 'Панель редактора и администратора каталога Анимо.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Strict Server-Side Authentication Guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // 2. Strict Server-Side Role Verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    redirect('/login?redirect=/admin&error=forbidden');
  }

  // 3. Fetch all anime (only authorized staff can reach this line)
  const { data: animeData } = await supabase
    .from('anime')
    .select('*, anime_genres(genres(*))')
    .order('updated_at', { ascending: false });

  // 4. Fetch all genres
  const { data: genresData } = await supabase
    .from('genres')
    .select('*')
    .order('name_ru');

  const allAnime = (animeData as Anime[]) || [];
  const allGenres = (genresData as Genre[]) || [];

  return <AdminWorkspace initialAnimeList={allAnime} allGenres={allGenres} />;
}
