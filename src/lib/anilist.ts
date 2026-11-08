import { createClient } from '@/lib/supabase/server';
import { translateGenre, sortAndFormatGenres } from './genres';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

export interface CalendarAiringItem {
  id: number;
  airingAt: number; // unix timestamp in seconds
  episode: number;
  mediaId: number;
  slug: string;
  titleRu: string | null;
  titleEn: string;
  titleJp: string | null;
  posterUrl: string;
  format: string;
  rawFormat: string;
  genres: string[];
  score: number | null;
  popularity: number;
  totalEpisodes: number | null;
  status: string;
  dbId?: string;
}

function mapFormatRu(format: string | null): string {
  switch (format) {
    case 'TV':
      return 'ТВ Сериал';
    case 'TV_SHORT':
      return 'ТВ Короткометражка';
    case 'MOVIE':
      return 'Фильм';
    case 'OVA':
      return 'OVA';
    case 'ONA':
      return 'ONA';
    default:
      return format || 'ТВ Сериал';
  }
}

const ALLOWED_AIRING_FORMATS = ['TV', 'TV_SHORT', 'ONA', 'OVA', 'MOVIE'];

const AIRING_SCHEDULE_QUERY = `
query ($start: Int, $end: Int, $page: Int) {
  Page (page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      id
      airingAt
      episode
      media {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
        }
        format
        genres
        isAdult
        popularity
        averageScore
        episodes
        status
      }
    }
  }
}
`;

/**
 * Fetches the official AniList airing schedule for the week.
 * Cached for 30 minutes (1800 seconds).
 */
export async function fetchCalendarAiringSchedule(): Promise<CalendarAiringItem[]> {
  try {
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMon = (day + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMon);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 7);
    sunday.setUTCHours(23, 59, 59, 999);

    // Buffers to cover all client timezones worldwide
    const start = Math.floor(monday.getTime() / 1000) - 86400;
    const end = Math.floor(sunday.getTime() / 1000) + 86400;

    const allSchedules: any[] = [];
    let page = 1;

    while (page <= 5) {
      const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: AIRING_SCHEDULE_QUERY,
          variables: { start, end, page },
        }),
        next: { revalidate: 1800 },
      });

      if (!res.ok) {
        break;
      }

      const json = await res.json();
      const schedules = json.data?.Page?.airingSchedules || [];
      allSchedules.push(...schedules);

      if (!json.data?.Page?.pageInfo?.hasNextPage) {
        break;
      }
      page++;
    }

    // Filter strictly: non-adult, no Hentai/Ecchi, allowed formats only, must have cover
    const validSchedules = allSchedules.filter((s) => {
      const m = s.media;
      if (!m || m.isAdult) return false;
      if (m.genres && (m.genres.includes('Hentai') || m.genres.includes('Ecchi'))) return false;
      if (!ALLOWED_AIRING_FORMATS.includes(m.format)) return false;
      if (!m.coverImage?.extraLarge && !m.coverImage?.large) return false;
      if (!s.airingAt) return false;
      return true;
    });

    // Cross-reference with Supabase to obtain Russian titles and database slugs
    const anilistIds = Array.from(new Set(validSchedules.map((s) => s.media.id)));
    const supabase = await createClient();
    const { data: dbAnime } = await supabase
      .from('anime')
      .select('id, slug, title_ru, title_en, anilist_id, poster_url')
      .in('anilist_id', anilistIds);

    const dbMap = new Map<number, any>();
    dbAnime?.forEach((a) => {
      if (a.anilist_id) dbMap.set(a.anilist_id, a);
    });

    const items: CalendarAiringItem[] = validSchedules.map((s) => {
      const m = s.media;
      const dbItem = dbMap.get(m.id);
      const titleEn = m.title?.english || m.title?.romaji || 'Anime';
      const titleRu = dbItem?.title_ru || null;
      const slug =
        dbItem?.slug ||
        `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${m.id}`;
      const posterUrl =
        dbItem?.poster_url || m.coverImage?.extraLarge || m.coverImage?.large;
      const genres = sortAndFormatGenres(m.genres || [], 3);

      return {
        id: s.id,
        airingAt: s.airingAt,
        episode: s.episode,
        mediaId: m.id,
        slug,
        titleRu,
        titleEn,
        titleJp: m.title?.native || null,
        posterUrl,
        format: mapFormatRu(m.format),
        rawFormat: m.format,
        genres,
        score: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : null,
        popularity: m.popularity || 0,
        totalEpisodes: m.episodes || null,
        status: m.status,
        dbId: dbItem?.id,
      };
    });

    return items;
  } catch (err) {
    console.error('Error fetching AniList airing schedule:', err);
    return [];
  }
}

export interface UpcomingAiringCardItem {
  id: string;
  slug: string;
  title: string;
  titleRu?: string | null;
  titleEn?: string | null;
  studio?: string | null;
  next_episode_at: string;
  poster_url: string;
  format: string;
  episode_num: number;
  popularity: number;
}

/**
 * Fetches popular upcoming episodes for the home page «Выходит сейчас» block.
 */
export async function fetchHomeAiringSchedule(
  minPopularity = 5000,
  limit = 12
): Promise<UpcomingAiringCardItem[]> {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const endSec = nowSec + 7 * 86400; // Next 7 days

    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: AIRING_SCHEDULE_QUERY,
        variables: { start: nowSec, end: endSec, page: 1 },
      }),
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const schedules = json.data?.Page?.airingSchedules || [];

    const valid = schedules.filter((s: any) => {
      const m = s.media;
      if (!m || m.isAdult) return false;
      if (m.genres && (m.genres.includes('Hentai') || m.genres.includes('Ecchi'))) return false;
      if (!ALLOWED_AIRING_FORMATS.includes(m.format)) return false;
      if (!m.coverImage?.extraLarge && !m.coverImage?.large) return false;
      if (!s.airingAt) return false;
      return true;
    });

    // Cross reference with DB for Russian titles
    const anilistIds = Array.from(new Set(valid.map((s: any) => s.media.id)));
    const supabase = await createClient();
    const { data: dbAnime } = await supabase
      .from('anime')
      .select('id, slug, title_ru, title_en, anilist_id, studio, poster_url')
      .in('anilist_id', anilistIds);

    const dbMap = new Map<number, any>();
    dbAnime?.forEach((a) => {
      if (a.anilist_id) dbMap.set(a.anilist_id, a);
    });

    // Map and filter by popularity
    const items: UpcomingAiringCardItem[] = valid
      .map((s: any) => {
        const m = s.media;
        const dbItem = dbMap.get(m.id);
        const titleEn = m.title?.english || m.title?.romaji || 'Anime';
        const titleRu = dbItem?.title_ru || null;
        const displayTitle = titleRu || titleEn;
        const slug =
          dbItem?.slug ||
          `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${m.id}`;
        const posterUrl =
          dbItem?.poster_url || m.coverImage?.extraLarge || m.coverImage?.large;
        const airDateIso = new Date(s.airingAt * 1000).toISOString();

        return {
          id: dbItem?.id || String(m.id),
          slug,
          title: displayTitle,
          titleRu,
          titleEn,
          studio: dbItem?.studio || null,
          next_episode_at: airDateIso,
          poster_url: posterUrl,
          format: mapFormatRu(m.format),
          episode_num: s.episode,
          popularity: m.popularity || 0,
        };
      })
      .filter((item: UpcomingAiringCardItem) => item.popularity >= minPopularity)
      .sort((a: UpcomingAiringCardItem, b: UpcomingAiringCardItem) => b.popularity - a.popularity)
      .slice(0, limit);

    return items;
  } catch (err) {
    console.error('Error in fetchHomeAiringSchedule:', err);
    return [];
  }
}
