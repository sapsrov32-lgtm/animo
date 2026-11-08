import { Metadata } from 'next';
import { CatalogView } from '@/components/catalog/CatalogView';
import { fetchCatalogAnime, fetchAllGenres, fetchCatalogStats } from '@/app/actions/catalog';

export const metadata: Metadata = {
  title: 'Каталог аниме — Анимо',
  description: 'Полный каталог аниме на русском языке: поиск, фильтры по жанрам, годам и статусу, честные рейтинги без пиратства.',
  openGraph: {
    title: 'Каталог аниме — Анимо',
    description: 'Полный каталог аниме на русском языке: поиск, фильтры по жанрам, годам и статусу, честные рейтинги без пиратства.',
    url: 'https://animo-virid.vercel.app/catalog',
    siteName: 'Анимо',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Каталог аниме — Анимо',
    description: 'Полный каталог аниме на русском языке: поиск, фильтры по жанрам, годам и статусу, честные рейтинги без пиратства.',
  },
  alternates: {
    canonical: 'https://animo-virid.vercel.app/catalog',
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const initialParams = {
    query: params.q || '',
    genre: params.genre || 'all',
    status: params.status || 'all',
    sort: params.sort || 'popularity',
    minScore: params.minScore ? Number(params.minScore) : undefined,
    yearFrom: params.yearFrom ? Number(params.yearFrom) : undefined,
    yearTo: params.yearTo ? Number(params.yearTo) : undefined,
    page: 1,
    perPage: 24,
  };

  const [initialData, genres, stats] = await Promise.all([
    fetchCatalogAnime(initialParams),
    fetchAllGenres(),
    fetchCatalogStats(),
  ]);

  return (
    <CatalogView
      initialItems={initialData.items}
      initialTotal={initialData.total}
      genres={genres}
      stats={stats}
      initialParams={initialParams}
    />
  );
}
