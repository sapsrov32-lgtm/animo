/**
 * Centralized filter rules for publicly accessible anime.
 * Applied across catalog, search, recommendations, detail pages, home, sitemap, etc.
 *
 * Excludes:
 * - is_adult === true (all 18+, hentai, ecchi)
 * - is_published === false
 * - poster_url is null or empty
 * - formats: Music / PV / CM / Specials / Shorts / Unknown
 */

export const EXCLUDED_FORMATS = [
  'Музыка',
  'Music',
  'MUSIC',
  'Спешл',
  'Спэшл',
  'Special',
  'SPECIAL',
  'ТВ Короткометражка',
  'Short',
  'SHORT',
  'UNKNOWN',
  'PV',
  'CM',
] as const;

export const ADULT_GENRE_SLUGS = ['ecchi', 'hentai', 'erotica'] as const;

export const ADULT_SEARCH_KEYWORDS = [
  'хента',
  'хентай',
  'hentai',
  'ecchi',
  'этти',
  '18+',
  'porn',
  'порно',
  'секс',
  'sex',
  'erotica',
  'эротика',
  'discipline',
  'дисциплина',
] as const;

/**
 * Checks whether a user search query is an explicit adult search term.
 */
export function isAdultSearchQuery(query: string): boolean {
  const q = (query || '').toLowerCase().trim();
  if (!q) return false;
  return ADULT_SEARCH_KEYWORDS.some((kw) => q.includes(kw));
}

/**
 * Applies the unified public anime filter to any Supabase query builder.
 */
export function applyPublicAnimeFilter<T>(queryBuilder: T): T {
  return (queryBuilder as any)
    .eq('is_published', true)
    .eq('is_adult', false)
    .not('poster_url', 'is', null)
    .neq('poster_url', '')
    .not('format', 'in', `(${EXCLUDED_FORMATS.map((f) => `"${f}"`).join(',')})`);
}

/**
 * Synchronous validator for an anime object in memory (e.g. on /anime/[slug], recommendations, etc.)
 */
export function isPublicAnime(anime: any): boolean {
  if (!anime) return false;
  if (!anime.is_published) return false;
  if (anime.is_adult) return false;
  if (!anime.poster_url || String(anime.poster_url).trim() === '') return false;
  if (anime.format && (EXCLUDED_FORMATS as readonly string[]).includes(anime.format)) return false;

  // Check genres if attached
  const genres = anime.anime_genres || anime.genres || [];
  if (Array.isArray(genres)) {
    for (const g of genres) {
      const slug = (g?.genres?.slug || g?.slug || '').toLowerCase();
      if ((ADULT_GENRE_SLUGS as readonly string[]).includes(slug)) return false;
      const name = (g?.genres?.name_ru || g?.name_ru || '').toLowerCase();
      if (name.includes('этти') || name.includes('хентай') || name.includes('эротика')) return false;
    }
  }

  return true;
}
