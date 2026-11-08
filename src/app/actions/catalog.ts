'use server';

import { createClient } from '@/lib/supabase/server';
import { Anime, Genre } from '@/types';

export interface CatalogFilterParams {
  query?: string;
  genre?: string;
  status?: string;
  format?: string;
  minScore?: number;
  yearFrom?: number;
  yearTo?: number;
  sort?: string;
  page?: number;
  perPage?: number;
}

const EXCLUDED_FORMATS = [
  'Музыка',
  'Music',
  'MUSIC',
  'Спэшл',
  'Special',
  'SPECIAL',
  'ТВ Короткометражка',
  'Short',
  'SHORT',
  'UNKNOWN',
];

export async function fetchCatalogAnime(params: CatalogFilterParams) {
  const supabase = await createClient();
  const page = params.page || 1;
  const perPage = params.perPage || 24;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const hasGenreFilter = Boolean(params.genre && params.genre !== 'all');

  const selectQuery = hasGenreFilter
    ? '*, anime_genres!inner(genre_id, genres!inner(*))'
    : '*, anime_genres(genres(*))';

  let queryBuilder = supabase
    .from('anime')
    .select(selectQuery, { count: 'exact' })
    .eq('is_published', true)
    .eq('is_adult', false);

  if (hasGenreFilter) {
    queryBuilder = queryBuilder.eq('anime_genres.genres.slug', params.genre);
  }

  // Format filter
  if (params.format && params.format !== 'all') {
    queryBuilder = queryBuilder.eq('format', params.format);
  } else {
    // Exclude music PV / CM, specials, and short formats by default
    queryBuilder = queryBuilder.not('format', 'in', `(${EXCLUDED_FORMATS.map((f) => `"${f}"`).join(',')})`);
  }

  // Search by title (ru, en, jp) - accelerated by GIN trigram indexes
  if (params.query && params.query.trim()) {
    const q = params.query.trim();
    queryBuilder = queryBuilder.or(`title_ru.ilike.%${q}%,title_en.ilike.%${q}%,title_jp.ilike.%${q}%`);
  }

  // Filter by status
  if (params.status && params.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', params.status);
  }

  // Filter by min score
  if (params.minScore) {
    queryBuilder = queryBuilder.gte('score', params.minScore);
  }

  // Filter by year
  if (params.yearFrom) {
    queryBuilder = queryBuilder.gte('year', params.yearFrom);
  }
  if (params.yearTo) {
    queryBuilder = queryBuilder.lte('year', params.yearTo);
  }

  // Sorting
  switch (params.sort) {
    case 'score':
      queryBuilder = queryBuilder
        .order('score', { ascending: false, nullsFirst: false })
        .order('popularity', { ascending: false, nullsFirst: false });
      break;
    case 'release_desc':
      queryBuilder = queryBuilder.order('year', { ascending: false, nullsFirst: false });
      break;
    case 'release_asc':
      queryBuilder = queryBuilder.order('year', { ascending: true, nullsFirst: false });
      break;
    case 'title_asc':
      queryBuilder = queryBuilder.order('title_en', { ascending: true, nullsFirst: false });
      break;
    case 'popularity':
    default:
      queryBuilder = queryBuilder
        .order('popularity', { ascending: false, nullsFirst: false })
        .order('score', { ascending: false, nullsFirst: false });
      break;
  }

  const { data, count, error } = await queryBuilder.range(from, to);

  if (error) {
    console.error('Error fetching catalog anime:', error);
    return { items: [], total: 0 };
  }

  return {
    items: (data as Anime[]) || [],
    total: count || 0,
  };
}

export async function fetchAllGenres(): Promise<Genre[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name_ru', { ascending: true });

  if (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
  return data || [];
}

export async function fetchCatalogStats() {
  const supabase = await createClient();
  const { count: totalCount } = await supabase
    .from('anime')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('format', 'in', `(${EXCLUDED_FORMATS.map((f) => `"${f}"`).join(',')})`);

  const { count: ongoingCount } = await supabase
    .from('anime')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('status', 'ongoing')
    .not('format', 'in', `(${EXCLUDED_FORMATS.map((f) => `"${f}"`).join(',')})`);

  return {
    total: totalCount || 0,
    ongoing: ongoingCount || 0,
  };
}
