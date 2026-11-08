import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminOverviewData } from '@/app/actions/admin-dashboard';
import { Genre } from '@/types';

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

  // 3. Fetch Overview Data & Genres
  const [overviewData, { data: genresData }] = await Promise.all([
    getAdminOverviewData('30d'),
    supabase.from('genres').select('*').order('name_ru'),
  ]);

  const allGenres = (genresData as Genre[]) || [];

  return <AdminDashboard initialData={overviewData} allGenres={allGenres} />;
}
