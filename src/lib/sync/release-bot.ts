import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface BotSyncResult {
  success: boolean;
  scanned: number;
  updated: number;
  added: number;
  skippedAdult: number;
  durationMs: number;
  timestamp: string;
  errors: string[];
}

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string | null;
  format: string | null;
  genres: string[] | null;
  isAdult: boolean | null;
  popularity: number | null;
  averageScore: number | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
  } | null;
  studios?: {
    nodes?: Array<{ name: string }>;
  } | null;
}

interface ShikimoriDetail {
  id: number;
  name: string;
  russian: string | null;
  rating: string | null;
  score: string | null;
  status: string | null;
  episodes: number | null;
  episodes_aired: number | null;
  description: string | null;
  genres?: Array<{ name: string; russian: string }>;
  studios?: Array<{ name: string }>;
  image?: {
    original?: string;
  };
  aired_on?: string | null;
}

const FORBIDDEN_GENRES = ['hentai', 'ecchi', 'erotica'];
const FORBIDDEN_RU_GENRES = ['хентай', 'эротика', 'этти'];
const TITLE_18_BLACKLIST = [
  'hentai',
  'anal mania',
  'doukyo? micchaku',
  'hatsu ecchi',
  'ero anime',
  'eromanga',
  'uncensored',
  'r-18',
  '18+',
];

function is18Plus(
  media: AniListMedia,
  shikimori?: ShikimoriDetail | null
): { forbidden: boolean; reason?: string } {
  // 1. AniList isAdult
  if (media.isAdult) {
    return { forbidden: true, reason: 'AniList isAdult=true' };
  }

  // 2. AniList genres
  if (media.genres && Array.isArray(media.genres)) {
    for (const g of media.genres) {
      if (g && FORBIDDEN_GENRES.includes(g.trim().toLowerCase())) {
        return { forbidden: true, reason: `AniList genre ${g}` };
      }
    }
  }

  // 3. Title blacklist
  const allTitles = [
    media.title?.romaji || '',
    media.title?.english || '',
    media.title?.native || '',
    shikimori?.russian || '',
    shikimori?.name || '',
  ]
    .join(' ')
    .toLowerCase();

  for (const blacklisted of TITLE_18_BLACKLIST) {
    if (allTitles.includes(blacklisted)) {
      return { forbidden: true, reason: `Blacklisted phrase: ${blacklisted}` };
    }
  }

  // 4. Shikimori rating (rx = Hentai, r_plus = Mild Nudity/Ecchi)
  if (shikimori?.rating) {
    const r = shikimori.rating.toLowerCase();
    if (r === 'rx' || r === 'r_plus') {
      return { forbidden: true, reason: `Shikimori rating ${shikimori.rating}` };
    }
  }

  // 5. Shikimori genres
  if (shikimori?.genres && Array.isArray(shikimori.genres)) {
    for (const g of shikimori.genres) {
      const name = (g.name || '').toLowerCase();
      const ru = (g.russian || '').toLowerCase();
      if (
        FORBIDDEN_GENRES.some((fg) => name.includes(fg)) ||
        FORBIDDEN_RU_GENRES.some((frg) => ru.includes(frg))
      ) {
        return { forbidden: true, reason: `Shikimori genre ${g.russian || g.name}` };
      }
    }
  }

  return { forbidden: false };
}

function mapFormat(raw: string | null): string {
  switch (raw) {
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
      return 'ТВ Сериал';
  }
}

function mapSeason(season: string | null): string | null {
  switch (season) {
    case 'WINTER':
      return 'Зима';
    case 'SPRING':
      return 'Весна';
    case 'SUMMER':
      return 'Лето';
    case 'FALL':
      return 'Осень';
    default:
      return null;
  }
}

function getAiringDay(airingAtSeconds: number): string {
  // Matches postgres check constraint: CHECK (airing_day = ANY (ARRAY['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']))
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const date = new Date(airingAtSeconds * 1000);
  return days[date.getDay()];
}

function cleanDescription(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .replace(/\[\/?\w+.*?\]/g, '') // Strip BBCode tags
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .trim() || null;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'anime'
  );
}

const POPULAR_RELEASING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
    }
    media(
      type: ANIME,
      status: RELEASING,
      sort: POPULARITY_DESC,
      isAdult: false,
      format_in: [TV, TV_SHORT, ONA, OVA]
    ) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      format
      genres
      isAdult
      popularity
      averageScore
      episodes
      status
      season
      seasonYear
      nextAiringEpisode {
        airingAt
        episode
      }
      studios(isMain: true) {
        nodes {
          name
        }
      }
    }
  }
}
`;

async function fetchShikimoriAnime(idMal: number): Promise<ShikimoriDetail | null> {
  try {
    const res = await fetch(`https://shikimori.one/api/animes/${idMal}`, {
      headers: {
        'User-Agent': 'AnimoBot/1.0 (contact: admin@animo.app)',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ShikimoriDetail;
  } catch (err) {
    return null;
  }
}

/**
 * Main automated bot engine:
 * 1. Fetches current releasing anime from AniList GraphQL.
 * 2. Filters out ANY adult/hentai content strictly.
 * 3. Enriches with Shikimori Russian metadata.
 * 4. Upserts schedules, episode numbers, titles, and posters into Supabase.
 * 5. Logs audit log & site settings.
 */
export async function runReleaseAutoSync(options?: {
  limit?: number;
  triggerSource?: string;
}): Promise<BotSyncResult> {
  const startTime = Date.now();
  const triggerSource = options?.triggerSource || 'cron';
  const perPage = Math.min(options?.limit || 50, 50);

  const result: BotSyncResult = {
    success: true,
    scanned: 0,
    updated: 0,
    added: 0,
    skippedAdult: 0,
    durationMs: 0,
    timestamp: new Date().toISOString(),
    errors: [],
  };

  try {
    const supabase = createAdminClient();

    // 1. Fetch from AniList GraphQL
    const anilistRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: POPULAR_RELEASING_QUERY,
        variables: { page: 1, perPage },
      }),
    });

    if (!anilistRes.ok) {
      throw new Error(`AniList returned HTTP ${anilistRes.status}`);
    }

    const anilistJson = await anilistRes.json();
    const mediaList: AniListMedia[] = anilistJson.data?.Page?.media || [];
    result.scanned = mediaList.length;

    if (mediaList.length === 0) {
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // 2. Fetch genres from DB for relation mapping
    const { data: dbGenres } = await supabase.from('genres').select('id, slug, name_ru');
    const genreMap = new Map<string, string>();
    dbGenres?.forEach((g) => {
      genreMap.set(g.slug.toLowerCase(), g.id);
      genreMap.set(g.name_ru.toLowerCase(), g.id);
    });

    // 3. Batch lookup existing anime in DB by anilist_id or shikimori_id
    const anilistIds = mediaList.map((m) => m.id);
    const malIds = mediaList.map((m) => m.idMal).filter((id): id is number => typeof id === 'number');

    const orFilters = [
      `anilist_id.in.(${anilistIds.join(',')})`,
      malIds.length > 0 ? `shikimori_id.in.(${malIds.join(',')})` : null,
    ]
      .filter(Boolean)
      .join(',');

    const { data: existingAnime } = await supabase
      .from('anime')
      .select('id, anilist_id, shikimori_id, slug, title_ru, title_en, description, poster_url')
      .or(orFilters);

    const existingByAniList = new Map<number, any>();
    const existingByShiki = new Map<number, any>();
    existingAnime?.forEach((a) => {
      if (a.anilist_id) existingByAniList.set(a.anilist_id, a);
      if (a.shikimori_id) existingByShiki.set(a.shikimori_id, a);
    });

    // 4. Process each media
    for (const media of mediaList) {
      // Preliminary 18+ check on AniList metadata
      const preCheck = is18Plus(media);
      if (preCheck.forbidden) {
        result.skippedAdult++;
        continue;
      }

      const existing = existingByAniList.get(media.id) || (media.idMal ? existingByShiki.get(media.idMal) : null);

      let shikimori: ShikimoriDetail | null = null;
      // If anime is new or lacks Russian title/description, fetch Shikimori
      if (!existing || !existing.title_ru || !existing.description) {
        if (media.idMal) {
          shikimori = await fetchShikimoriAnime(media.idMal);
          // Wait 150ms between Shikimori requests to respect rate limits
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      // Secondary 18+ check with Shikimori data
      const fullCheck = is18Plus(media, shikimori);
      if (fullCheck.forbidden) {
        result.skippedAdult++;
        continue;
      }

      const nextEpAt = media.nextAiringEpisode?.airingAt
        ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString()
        : null;
      const airingDay = media.nextAiringEpisode?.airingAt
        ? getAiringDay(media.nextAiringEpisode.airingAt)
        : null;

      const score = media.averageScore
        ? Number((media.averageScore / 10).toFixed(1))
        : shikimori?.score
        ? Number(shikimori.score)
        : null;

      const studioName = media.studios?.nodes?.[0]?.name || shikimori?.studios?.[0]?.name || null;
      const posterUrl =
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        (shikimori?.image?.original ? `https://shikimori.one${shikimori.image.original}` : null);

      if (existing) {
        // UPDATE existing anime
        const updatePayload: Record<string, any> = {
          status: 'ongoing',
          next_episode_at: nextEpAt,
          airing_day: airingDay,
          popularity: media.popularity || 0,
          updated_at: new Date().toISOString(),
        };

        if (score) updatePayload.score = score;
        if (studioName && !existing.studio) updatePayload.studio = studioName;
        if (media.episodes && !existing.episodes) updatePayload.episodes = media.episodes;
        if (!existing.title_ru && shikimori?.russian) updatePayload.title_ru = shikimori.russian;
        if (!existing.description && shikimori?.description) {
          updatePayload.description = cleanDescription(shikimori.description);
        }
        if (!existing.poster_url && posterUrl) updatePayload.poster_url = posterUrl;
        if (media.idMal && !existing.shikimori_id) updatePayload.shikimori_id = media.idMal;
        if (!existing.anilist_id) updatePayload.anilist_id = media.id;

        const { error: updateError } = await supabase
          .from('anime')
          .update(updatePayload)
          .eq('id', existing.id);

        if (updateError) {
          result.errors.push(`Update failed for ${existing.id}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      } else {
        // INSERT brand new anime
        const titleRu = shikimori?.russian || null;
        const titleEn = media.title?.english || media.title?.romaji || 'Anime';
        const titleJp = media.title?.native || null;
        const baseSlugTitle = titleRu || titleEn;
        const slug = `${slugify(baseSlugTitle)}-${media.idMal || media.id}`;

        const insertPayload = {
          slug,
          title_ru: titleRu,
          title_en: titleEn,
          title_jp: titleJp,
          description: cleanDescription(shikimori?.description),
          year: media.seasonYear || (shikimori?.aired_on ? parseInt(shikimori.aired_on.slice(0, 4)) : new Date().getFullYear()),
          season: mapSeason(media.season),
          status: 'ongoing',
          format: mapFormat(media.format),
          episodes: media.episodes || shikimori?.episodes || null,
          poster_url: posterUrl,
          banner_url: media.bannerImage || null,
          anilist_id: media.id,
          shikimori_id: media.idMal || null,
          airing_day: airingDay,
          next_episode_at: nextEpAt,
          score,
          studio: studioName,
          is_published: true,
          is_adult: false,
          popularity: media.popularity || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('anime')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Insert failed for ${titleEn}: ${insertError.message}`);
        } else if (inserted) {
          result.added++;

          // Connect genres to anime_genres
          const allMediaGenres = [
            ...(media.genres || []),
            ...(shikimori?.genres?.map((g) => g.russian) || []),
          ];

          const genreIdsToLink: string[] = [];
          for (const rawG of allMediaGenres) {
            const matchedId = genreMap.get(rawG.toLowerCase());
            if (matchedId && !genreIdsToLink.includes(matchedId)) {
              genreIdsToLink.push(matchedId);
            }
          }

          if (genreIdsToLink.length > 0) {
            const genreRows = genreIdsToLink.map((gId) => ({
              anime_id: inserted.id,
              genre_id: gId,
            }));
            await supabase.from('anime_genres').insert(genreRows);
          }
        }
      }
    }

    // 5. Save audit log
    await supabase.from('admin_audit_logs').insert({
      admin_username: `AutoBot (${triggerSource})`,
      action: 'auto_sync_releases',
      entity_type: 'cron_bot',
      entity_id: 'release-sync',
      details: {
        scanned: result.scanned,
        updated: result.updated,
        added: result.added,
        skipped_adult: result.skippedAdult,
        duration_ms: Date.now() - startTime,
        errors_count: result.errors.length,
      },
      created_at: new Date().toISOString(),
    });

    // 6. Save latest run stats in site_settings
    await supabase.from('site_settings').upsert({
      key: 'release_bot_stats',
      value: {
        last_run: new Date().toISOString(),
        status: result.errors.length > 0 ? 'warning' : 'success',
        summary: {
          scanned: result.scanned,
          updated: result.updated,
          added: result.added,
          skipped_adult: result.skippedAdult,
        },
      },
      updated_at: new Date().toISOString(),
    });

    // 7. Invalidate caches for instant updates
    try {
      revalidatePath('/');
      revalidatePath('/calendar');
      revalidatePath('/catalog');
    } catch {
      // Ignore if called in environment where revalidatePath isn't bound
    }
  } catch (err: any) {
    result.success = false;
    result.errors.push(err?.message || 'Unknown auto-sync error');
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

export interface BotScheduleConfig {
  enabled: boolean;
  scheduledTime: string; // e.g. "04:00"
  timezone?: string;
}

export async function getBotScheduleConfig(): Promise<BotScheduleConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'release_bot_settings')
      .maybeSingle();

    if (data?.value) {
      return {
        enabled: data.value.enabled ?? true,
        scheduledTime: data.value.scheduledTime || '04:00',
        timezone: data.value.timezone || 'Asia/Bishkek',
      };
    }
  } catch {}
  return { enabled: true, scheduledTime: '04:00', timezone: 'Asia/Bishkek' };
}

export async function checkAndTriggerScheduledSync(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'release_bot_settings')
      .maybeSingle();

    const config = settingsRow?.value || { enabled: true, scheduledTime: '04:00' };
    if (!config.enabled) return false;

    const { data: statsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'release_bot_stats')
      .maybeSingle();

    const lastRunIso = statsRow?.value?.last_run;
    const now = new Date();
    const [schedH, schedM] = (config.scheduledTime || '04:00').split(':').map(Number);

    const targetToday = new Date(now);
    targetToday.setHours(schedH || 4, schedM || 0, 0, 0);

    // If current time is past today's target time
    if (now.getTime() >= targetToday.getTime()) {
      const lastRunTime = lastRunIso ? new Date(lastRunIso).getTime() : 0;
      // If we haven't synced today yet
      if (lastRunTime < targetToday.getTime()) {
        runReleaseAutoSync({ triggerSource: 'scheduled_auto_timer' }).catch((err) =>
          console.error('Scheduled sync execution error:', err)
        );
        return true;
      }
    }
  } catch (err) {
    console.error('Error checking scheduled sync:', err);
  }
  return false;
}
