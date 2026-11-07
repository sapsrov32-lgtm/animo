import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';
import { Anime, Genre } from '@/types';

export const metadata: Metadata = {
  title: 'Админ-панель — Управление каталогом Анимо',
  description: 'Панель редактора и администратора каталога Анимо.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Check user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // 2. Verify server-side role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container/20 text-error flex items-center justify-center mb-4 border border-error/30">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
          Доступ ограничен
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-2 mb-6">
          У вашего аккаунта нет прав редактора или администратора каталога. Панель управления доступна только команде сервиса.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 transition-all shadow-md"
        >
          Вернуться на главную
        </Link>
      </div>
    );
  }

  // 3. Fetch all anime (including unpublished / drafts)
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
