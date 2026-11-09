'use server';

import { createClient } from '@/lib/supabase/server';
import { Anime, Genre } from '@/types';
import {
  applyPublicAnimeFilter,
  isAdultSearchQuery,
  ADULT_GENRE_SLUGS,
  EXCLUDED_FORMATS,
} from '@/lib/anime-filter';

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

export async function fetchCatalogAnime(params: CatalogFilterParams) {
  const supabase = await createClient();
  const page = params.page || 1;
  const perPage = params.perPage || 24;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Strict check: if requested genre is adult (e.g. ecchi), return empty
  if (params.genre && (ADULT_GENRE_SLUGS as readonly string[]).includes(params.genre.toLowerCase())) {
    return { items: [], total: 0 };
  }

  // Strict check: if search query is an adult keyword, return empty to prevent leaks
  if (params.query && isAdultSearchQuery(params.query)) {
    return { items: [], total: 0 };
  }

  const hasGenreFilter = Boolean(params.genre && params.genre !== 'all');

  const selectQuery = hasGenreFilter
    ? '*, anime_genres!inner(genre_id, genres!inner(*))'
    : '*, anime_genres(genres(*))';

  let queryBuilder = supabase
    .from('anime')
    .select(selectQuery, { count: 'exact' });

  // Apply unified public filter (is_published=true, is_adult=false, poster valid, format valid)
  queryBuilder = applyPublicAnimeFilter(queryBuilder);

  if (hasGenreFilter) {
    queryBuilder = queryBuilder.eq('anime_genres.genres.slug', params.genre);
  }

  // Format filter
  if (params.format && params.format !== 'all') {
    queryBuilder = queryBuilder.eq('format', params.format);
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

  // Strict suppression of 18+ / ecchi / adult genres from public catalog
  return (data || []).filter(
    (g: Genre) =>
      !(ADULT_GENRE_SLUGS as readonly string[]).includes(g.slug.toLowerCase()) &&
      !g.name_ru.toLowerCase().includes('этти') &&
      !g.name_ru.toLowerCase().includes('хентай')
  );
}

export async function fetchCatalogStats() {
  const supabase = await createClient();

  const totalQuery = applyPublicAnimeFilter(
    supabase.from('anime').select('*', { count: 'exact', head: true })
  );
  const { count: totalCount } = await totalQuery;

  const ongoingQuery = applyPublicAnimeFilter(
    supabase
      .from('anime')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing')
  );
  const { count: ongoingCount } = await ongoingQuery;

  return {
    total: totalCount || 0,
    ongoing: ongoingCount || 0,
  };
}

export interface QuickSearchResult {
  id: string;
  slug: string;
  title_ru?: string | null;
  title_en?: string | null;
  format?: string | null;
  year?: number | null;
  score?: number | null;
  poster_url?: string | null;
  status: string;
}

export async function quickSearchAnime(query: string, limit = 5): Promise<QuickSearchResult[]> {
  const sanitized = (query || '').replace(/[,()]/g, ' ').trim();
  if (sanitized.length < 2) return [];

  // Adult keyword suppression: searches like "hentai", "хента", "ecchi", "18+" return empty
  if (isAdultSearchQuery(sanitized)) {
    return [];
  }

  const supabase = await createClient();

  let queryBuilder = supabase
    .from('anime')
    .select('id, slug, title_ru, title_en, format, year, score, poster_url, status');

  queryBuilder = applyPublicAnimeFilter(queryBuilder)
    .or(`title_ru.ilike.%${sanitized}%,title_en.ilike.%${sanitized}%,title_jp.ilike.%${sanitized}%`)
    .order('popularity', { ascending: false, nullsFirst: false })
    .order('score', { ascending: false, nullsFirst: false })
    .limit(limit);

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error in quickSearchAnime:', error);
    return [];
  }

  return (data as QuickSearchResult[]) || [];
}
