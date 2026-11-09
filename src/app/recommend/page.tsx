import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { RecommendWorkspace } from '@/components/recommend/RecommendWorkspace';
import { Anime } from '@/types';
import { applyPublicAnimeFilter, isPublicAnime } from '@/lib/anime-filter';

export const metadata: Metadata = {
  title: 'Что посмотреть? Интеллектуальный компас',
  description:
    'Умный алгоритм персонального подбора аниме по 3 простым критериям: настроение, доступное время и желаемый сеттинг.',
  openGraph: {
    title: 'Что посмотреть? Интеллектуальный компас | Анимо',
    description:
      'Умный алгоритм персонального подбора аниме по 3 простым критериям: настроение, доступное время и желаемый сеттинг.',
    url: 'https://animo-virid.vercel.app/recommend',
    siteName: 'Анимо',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Что посмотреть? Интеллектуальный компас | Анимо',
    description:
      'Умный алгоритм персонального подбора аниме по 3 простым критериям: настроение, доступное время и желаемый сеттинг.',
  },
  alternates: {
    canonical: 'https://animo-virid.vercel.app/recommend',
  },
};

export const dynamic = 'force-dynamic';

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const initialMood = params.mood;
  const supabase = await createClient();

  // Fetch candidate anime with genres for recommendation filtering (strictly excluding 18+)
  let queryBuilder = supabase
    .from('anime')
    .select('*, anime_genres(genres(*))');

  queryBuilder = applyPublicAnimeFilter(queryBuilder)
    .order('popularity', { ascending: false, nullsFirst: false })
    .limit(2500);

  const { data: animeData, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching recommendation anime:', error);
  }

  const allAnime = ((animeData as Anime[]) || []).filter((a) => isPublicAnime(a));

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
    <>
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: 'https://animo-virid.vercel.app',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Что посмотреть',
                item: 'https://animo-virid.vercel.app/recommend',
              },
            ],
          }),
        }}
      />
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <RecommendWorkspace
          allAnime={allAnime}
          userAnimeMap={userAnimeMap}
          isLoggedIn={Boolean(user)}
          initialMood={initialMood}
        />
      </Suspense>
    </>
  );
}
