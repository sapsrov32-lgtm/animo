import { createClient } from '@supabase/supabase-js';

// Configuration: can be overridden via command line argument (e.g. `150` or `200`)
const TARGET_COUNT = parseInt(process.argv[2] || '150', 10);
const PER_PAGE = 50;
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

// Clean keys from environment (strictly from .env.local via --env-file)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Ошибка: не заданы NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Genre mapping dictionary: AniList English name -> Russian name & English slug
const GENRE_MAP: Record<string, { name_ru: string; slug: string }> = {
  Action: { name_ru: 'Экшен', slug: 'action' },
  Adventure: { name_ru: 'Приключения', slug: 'adventure' },
  Comedy: { name_ru: 'Комедия', slug: 'comedy' },
  Drama: { name_ru: 'Драма', slug: 'drama' },
  Fantasy: { name_ru: 'Фэнтези', slug: 'fantasy' },
  Horror: { name_ru: 'Ужасы', slug: 'horror' },
  'Mahou Shoujo': { name_ru: 'Махо-сёдзё', slug: 'mahou-shoujo' },
  Mecha: { name_ru: 'Меха', slug: 'mecha' },
  Music: { name_ru: 'Музыка', slug: 'music' },
  Mystery: { name_ru: 'Детектив', slug: 'mystery' },
  Psychological: { name_ru: 'Психология', slug: 'psychological' },
  Romance: { name_ru: 'Романтика', slug: 'romance' },
  'Sci-Fi': { name_ru: 'Фантастика', slug: 'sci-fi' },
  'Slice of Life': { name_ru: 'Повседневность', slug: 'slice-of-life' },
  Sports: { name_ru: 'Спорт', slug: 'sports' },
  Supernatural: { name_ru: 'Сверхъестественное', slug: 'supernatural' },
  Thriller: { name_ru: 'Триллер', slug: 'thriller' },
  Ecchi: { name_ru: 'Этти', slug: 'ecchi' },
};

const DAYS_OF_WEEK = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function cleanHtml(raw: string | null): string | null {
  if (!raw) return null;
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function generateSlug(title: string, anilistId: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'anime';
  return `${base}-${anilistId}`;
}

function mapStatus(status: string | null): 'ongoing' | 'finished' | 'announced' {
  switch (status) {
    case 'RELEASING':
      return 'ongoing';
    case 'FINISHED':
    case 'CANCELLED':
      return 'finished';
    case 'NOT_YET_RELEASED':
      return 'announced';
    case 'HIATUS':
      return 'ongoing';
    default:
      return 'finished';
  }
}

function mapFormat(format: string | null): string {
  switch (format) {
    case 'TV':
      return 'ТВ Сериал';
    case 'TV_SHORT':
      return 'ТВ Короткометражка';
    case 'MOVIE':
      return 'Фильм';
    case 'SPECIAL':
      return 'Спэшл';
    case 'OVA':
      return 'OVA';
    case 'ONA':
      return 'ONA';
    case 'MUSIC':
      return 'Клип';
    default:
      return format || 'ТВ Сериал';
  }
}

function mapSeason(season: string | null, year: number | null): string | null {
  if (!season && !year) return null;
  const seasons: Record<string, string> = {
    WINTER: 'Зима',
    SPRING: 'Весна',
    SUMMER: 'Лето',
    FALL: 'Осень',
  };
  const seasonRu = season ? seasons[season] || season : '';
  return seasonRu && year ? `${seasonRu} ${year}` : (seasonRu || `${year}`);
}

const GRAPHQL_QUERY = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media (type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      seasonYear
      season
      status
      format
      episodes
      coverImage {
        extraLarge
        large
      }
      bannerImage
      averageScore
      genres
      studios(isMain: true) {
        nodes {
          name
        }
      }
      nextAiringEpisode {
        airingAt
        episode
      }
    }
  }
}
`;

async function fetchAniListPage(page: number, perPage: number, retryCount = 0): Promise<any> {
  try {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { page, perPage },
      }),
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
      console.warn(`[AniList] Получен статус 429 (Rate Limit). Ожидание ${retryAfter} сек...`);
      await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
      return fetchAniListPage(page, perPage, retryCount + 1);
    }

    if (!res.ok) {
      throw new Error(`AniList HTTP error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.data?.Page;
  } catch (err) {
    if (retryCount < 3) {
      console.warn(`[AniList] Сбой запроса страницы ${page}, повтор через 3 сек...`);
      await new Promise((r) => setTimeout(r, 3000));
      return fetchAniListPage(page, perPage, retryCount + 1);
    }
    throw err;
  }
}

async function runImport() {
  console.log(`[Анимо] Запуск импорта ${TARGET_COUNT} популярных тайтлов из AniList GraphQL...`);

  // 1. Предварительно убедимся, что жанры из словаря загружены в таблицу genres
  console.log('[Анимо] Синхронизация жанров...');
  const genreEntries = Object.entries(GENRE_MAP).map(([_, val]) => ({
    name_ru: val.name_ru,
    slug: val.slug,
  }));

  const { error: genreErr } = await supabase
    .from('genres')
    .upsert(genreEntries, { onConflict: 'slug' });

  if (genreErr) {
    console.error('Ошибка сохранения жанров:', genreErr.message);
    process.exit(1);
  }

  // Получим карту genre slug -> id из базы
  const { data: dbGenres } = await supabase.from('genres').select('id, slug');
  const genreSlugToId = new Map<string, string>();
  dbGenres?.forEach((g) => genreSlugToId.set(g.slug, g.id));

  let fetched = 0;
  let page = 1;
  let totalSaved = 0;

  while (fetched < TARGET_COUNT) {
    const toFetch = Math.min(PER_PAGE, TARGET_COUNT - fetched);
    console.log(`[AniList] Загрузка страницы ${page} (${toFetch} тайтлов)...`);

    const pageData = await fetchAniListPage(page, toFetch);
    const mediaList = pageData?.media || [];

    if (mediaList.length === 0) {
      console.log('[AniList] Больше нет данных.');
      break;
    }

    // Подготовка пакета тайтлов для upsert
    const animeRows = mediaList.map((m: any) => {
      const titleEn = m.title?.english || m.title?.romaji || null;
      const titleJp = m.title?.native || null;
      const slug = generateSlug(titleEn || `anime-${m.id}`, m.id);

      let next_episode_at: string | null = null;
      let airing_day: string | null = null;

      if (m.nextAiringEpisode?.airingAt) {
        const date = new Date(m.nextAiringEpisode.airingAt * 1000);
        next_episode_at = date.toISOString();
        airing_day = DAYS_OF_WEEK[date.getUTCDay()];
      }

      return {
        anilist_id: m.id,
        slug,
        title_ru: null, // По условию: null при отсутствии в источнике, сайт использует fallback title_en -> title_jp
        title_en: titleEn,
        title_jp: titleJp,
        description: cleanHtml(m.description),
        year: m.seasonYear || null,
        season: mapSeason(m.season, m.seasonYear),
        status: mapStatus(m.status),
        format: mapFormat(m.format),
        episodes: m.episodes || null,
        poster_url: m.coverImage?.extraLarge || m.coverImage?.large || null,
        banner_url: m.bannerImage || null,
        score: m.averageScore ? Number((m.averageScore / 10).toFixed(2)) : null,
        studio: m.studios?.nodes?.[0]?.name || null,
        airing_day,
        next_episode_at,
        is_published: true,
        updated_at: new Date().toISOString(),
      };
    });

    const { data: upsertedAnime, error: animeErr } = await supabase
      .from('anime')
      .upsert(animeRows, { onConflict: 'anilist_id' })
      .select('id, anilist_id');

    if (animeErr) {
      console.error(`Ошибка сохранения аниме на странице ${page}:`, animeErr.message);
      process.exit(1);
    }

    // Привязка жанров
    const animeIdMap = new Map<number, string>();
    upsertedAnime?.forEach((a) => animeIdMap.set(a.anilist_id, a.id));

    const animeGenreRows: { anime_id: string; genre_id: string }[] = [];
    mediaList.forEach((m: any) => {
      const animeId = animeIdMap.get(m.id);
      if (!animeId) return;

      const genres: string[] = m.genres || [];
      genres.forEach((rawGenre) => {
        const mapped = GENRE_MAP[rawGenre];
        if (mapped) {
          const genreId = genreSlugToId.get(mapped.slug);
          if (genreId) {
            animeGenreRows.push({ anime_id: animeId, genre_id: genreId });
          }
        }
      });
    });

    if (animeGenreRows.length > 0) {
      const { error: agErr } = await supabase
        .from('anime_genres')
        .upsert(animeGenreRows, { onConflict: 'anime_id,genre_id' });

      if (agErr) {
        console.warn(`Предупреждение при связывании жанров:`, agErr.message);
      }
    }

    totalSaved += animeRows.length;
    fetched += mediaList.length;
    console.log(`✓ Страница ${page} успешно импортирована (всего сохранено: ${totalSaved}/${TARGET_COUNT})`);

    if (!pageData.pageInfo?.hasNextPage) {
      break;
    }

    page++;
    // Пауза 1.5 секунды между запросами для строгого соблюдения лимитов AniList
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n🎉 Импорт успешно завершен! Сохранено тайтлов: ${totalSaved}`);
}

runImport().catch((e) => {
  console.error('Критическая ошибка импорта:', e);
  process.exit(1);
});
