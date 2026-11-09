import { createClient } from '@/lib/supabase/server';
import { HomeView } from '@/components/home/HomeView';
import { fetchHomeAiringSchedule } from '@/lib/anilist';
import { HERO_ANIME, POPULAR_ANIME, SEASON_ANIME } from '@/data/mockAnime';
import { Anime } from '@/types';
import { applyPublicAnimeFilter } from '@/lib/anime-filter';

export const revalidate = 60; // Cache for 60 seconds

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://animo-virid.vercel.app/#website',
      url: 'https://animo-virid.vercel.app',
      name: 'Анимо',
      alternateName: ['Animo', 'Анимо аниме'],
      description: 'Каталог аниме, трекер серий и календарь релизов',
      inLanguage: 'ru',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://animo-virid.vercel.app/catalog?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://animo-virid.vercel.app/#organization',
      name: 'Анимо',
      url: 'https://animo-virid.vercel.app',
      logo: 'https://animo-virid.vercel.app/favicon.ico',
    },
  ],
};

export default async function HomePage() {
  const supabase = await createClient();

  const MAIN_FORMATS = ['ТВ Сериал', 'Фильм', 'OVA', 'ONA'];

  // Fetch real anime from Supabase & user session in parallel
  const [
    { data: topAnimeList },
    { data: popularData },
    ongoingData,
    { data: seasonalData },
    userRes,
  ] = await Promise.all([
    // Hero Anime: Masterpiece TV series or major movie with verified poster and Russian description
    applyPublicAnimeFilter(
      supabase
        .from('anime')
        .select('*, anime_genres(genres(*))')
        .in('format', ['ТВ Сериал', 'Фильм'])
        .not('description', 'is', null)
        .gte('popularity', 500000)
    )
      .order('popularity', { ascending: false, nullsFirst: false })
      .limit(5),

    // Popular Now: Top released masterworks, strictly non-adult, sorted by AniList popularity
    applyPublicAnimeFilter(
      supabase
        .from('anime')
        .select('*, anime_genres(genres(*))')
        .in('status', ['finished', 'ongoing'])
        .in('format', MAIN_FORMATS)
        .or('episodes.gt.1,format.eq.Фильм')
        .gte('popularity', 1000)
    )
      .order('popularity', { ascending: false, nullsFirst: false })
      .range(0, 14),

    // Ongoing: Popular series airing in the upcoming 7 days from AniList airingSchedule
    fetchHomeAiringSchedule(5000, 12),

    // Seasonal: Hits of recent years sorted by popularity
    applyPublicAnimeFilter(
      supabase
        .from('anime')
        .select('*, anime_genres(genres(*))')
        .in('status', ['finished', 'ongoing'])
        .in('format', MAIN_FORMATS)
        .gte('year', 2022)
        .gte('popularity', 1000)
    )
      .order('year', { ascending: false, nullsFirst: false })
      .order('popularity', { ascending: false, nullsFirst: false })
      .limit(12),

    supabase.auth.getUser(),
  ]);

  const user = userRes.data?.user;
  let userStats = null;

  if (user) {
    const { data: userAnime } = await supabase
      .from('user_anime')
      .select('status, progress, score, updated_at, anime(anime_genres(genres(name_ru)))')
      .eq('user_id', user.id);

    if (userAnime && userAnime.length > 0) {
      const totalEpisodes = userAnime.reduce((acc, row) => acc + (row.progress || 0), 0);
      const completedCount = userAnime.filter((row) => row.status === 'done').length;
      const scoredRows = userAnime.filter((row) => typeof row.score === 'number' && row.score > 0);
      const averageScore =
        scoredRows.length > 0
          ? scoredRows.reduce((acc, row) => acc + row.score!, 0) / scoredRows.length
          : null;

      // Count genres
      const genreCounts: Record<string, number> = {};
      userAnime.forEach((row: any) => {
        const genres =
          row.anime?.anime_genres?.map((ag: any) => ag.genres?.name_ru).filter(Boolean) || [];
        genres.forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });
      const topGenreEntry = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
      const topGenre = topGenreEntry ? topGenreEntry[0] : null;

      // Calculate streak
      const distinctDays = Array.from(
        new Set(
          userAnime
            .map((r) => (r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : null))
            .filter(Boolean)
        )
      )
        .sort()
        .reverse();

      let streakDays = 0;
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      if (distinctDays[0] === todayStr || distinctDays[0] === yesterdayStr) {
        let curr = new Date(distinctDays[0]!);
        streakDays = 1;
        for (let i = 1; i < distinctDays.length; i++) {
          const prev = new Date(distinctDays[i]!);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
          if (diffDays === 1) {
            streakDays++;
            curr = prev;
          } else {
            break;
          }
        }
      }

      // Calculate monthly episodes
      const currentYear = new Date().getFullYear();
      const monthlyEpisodes = new Array(12).fill(0);
      userAnime.forEach((r) => {
        if (r.updated_at) {
          const d = new Date(r.updated_at);
          if (d.getFullYear() === currentYear) {
            monthlyEpisodes[d.getMonth()] += r.progress || 1;
          }
        }
      });

      userStats = {
        totalEpisodes,
        completedCount,
        averageScore,
        topGenre,
        streakDays,
        monthlyEpisodes,
      };
    } else {
      userStats = {
        totalEpisodes: 0,
        completedCount: 0,
        averageScore: null,
        topGenre: null,
        streakDays: 0,
        monthlyEpisodes: new Array(12).fill(0),
      };
    }
  }

  // Find candidate with Russian description
  const heroCandidate =
    topAnimeList?.find(
      (a) =>
        a.description &&
        /[а-яё]/i.test(a.description) &&
        !a.description.includes('культового тайтла')
    ) ||
    topAnimeList?.[0] ||
    HERO_ANIME;

  const popularAnime =
    popularData && popularData.length > 0 ? (popularData as Anime[]) : POPULAR_ANIME;
  const ongoingAnime = (ongoingData as any[]) || [];
  const seasonalAnime =
    seasonalData && seasonalData.length > 0 ? (seasonalData as Anime[]) : SEASON_ANIME;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeView
        heroAnime={heroCandidate as Anime}
        popularAnime={popularAnime}
        ongoingAnime={ongoingAnime}
        seasonalAnime={seasonalAnime}
        isLoggedIn={Boolean(user)}
        userStats={userStats}
      />
    </>
  );
}
