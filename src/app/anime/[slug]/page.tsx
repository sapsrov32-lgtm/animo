import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Anime, Genre } from '@/types';
import { getDisplayTitle, getSecondaryTitle, cleanDescription, isRussianText } from '@/lib/format';
import { sortAndFormatGenres } from '@/lib/genres';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AiringCountdown } from '@/components/anime/AiringCountdown';
import { WatchStatusTracker } from '@/components/anime/WatchStatusTracker';
import { WhereToWatch } from '@/components/anime/WhereToWatch';
import { ShareButton } from '@/components/anime/ShareButton';
import { fetchSimilarAnime } from '@/lib/anilist';
import { applyPublicAnimeFilter, isPublicAnime } from '@/lib/anime-filter';

export const revalidate = 3600; // Кеширование страниц аниме на Vercel Edge на 1 час (ISR)

interface PageProps {
  params: Promise<{ slug: string }>;
}

const isUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Кеширование запроса аниме между generateMetadata и страницей в рамках одного запроса
const getAnime = cache(async (slug: string) => {
  const supabase = await createClient();
  const isUuid = isUuidRegex.test(slug);
  let query = supabase
    .from('anime')
    .select('*, anime_genres(genres(*))');

  query = applyPublicAnimeFilter(query);

  if (isUuid) {
    query = query.or(`slug.eq.${slug},id.eq.${slug}`);
  } else {
    query = query.eq('slug', slug);
  }
  const { data } = await query.maybeSingle();
  if (!data || !isPublicAnime(data)) {
    return null;
  }
  return data;
});

function extractSeoDescription(anime: any, title: string): string {
  const cleaned = cleanDescription(anime.description);
  if (cleaned && cleaned.length >= 25 && isRussianText(cleaned)) {
    const singleLine = cleaned.replace(/\s+/g, ' ').trim();
    if (singleLine.length > 160) {
      const slice = singleLine.slice(0, 157);
      const lastSpace = slice.lastIndexOf(' ');
      const trimmed = lastSpace > 120 ? slice.slice(0, lastSpace) : slice;
      return `${trimmed}...`;
    }
    return singleLine;
  }

  // Fallback as requested: «{Название}: жанры, рейтинг, число серий»
  const rawGenres: Genre[] = anime.anime_genres?.map((ag: any) => ag.genres).filter(Boolean) || [];
  const sortedNames = sortAndFormatGenres(rawGenres.map((g) => g.name_ru), 3);
  const genresStr = sortedNames.length > 0 ? sortedNames.join(', ') : 'аниме';
  const scoreStr = anime.score ? anime.score.toFixed(1) : '—';
  const episodesStr =
    anime.format === 'Фильм'
      ? 'Фильм'
      : typeof anime.episodes === 'number' && anime.episodes > 0
      ? `${anime.episodes} серий`
      : anime.status === 'ongoing' || anime.status === 'RELEASING'
      ? 'идёт показ'
      : '—';

  return `${title}: ${genresStr}, рейтинг ${scoreStr}, ${episodesStr}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getAnime(slug);
  const canonicalUrl = `https://animo-virid.vercel.app/anime/${slug}`;

  if (!anime) {
    return {
      title: 'Тайтл не найден — Анимо',
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const title = getDisplayTitle(anime);
  // Title format: «{Название} — описание, рейтинг, серии | Анимо»
  const seoTitle = `${title} — описание, рейтинг, серии | Анимо`;
  const seoDescription = extractSeoDescription(anime, title);
  const poster = anime.poster_url || anime.banner_url || '';
  const posterAbsoluteUrl = poster
    ? poster.startsWith('http')
      ? poster
      : `https://animo-virid.vercel.app${poster}`
    : 'https://animo-virid.vercel.app/og-image.jpg';

  return {
    title: {
      absolute: seoTitle,
    },
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: 'Анимо',
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: posterAbsoluteUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [posterAbsoluteUrl],
    },
  };
}

export default async function AnimeDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Параллельный запрос тайтла и текущего пользователя (ускорение в 2 раза)
  const [anime, userRes] = await Promise.all([
    getAnime(slug),
    supabase.auth.getUser(),
  ]);

  if (!anime) {
    notFound();
  }

  const user = userRes.data?.user;
  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);
  const rawGenres: Genre[] = anime.anime_genres?.map((ag: any) => ag.genres).filter(Boolean) || [];
  const sortedNames = sortAndFormatGenres(rawGenres.map((g) => g.name_ru), 10);
  const genres: Genre[] = sortedNames
    .map((name) => rawGenres.find((g) => g.name_ru === name))
    .filter(Boolean) as Genre[];
  const firstGenreId = genres[0]?.id;

  // Параллельный запрос сохранённого статуса и настоящих похожих аниме (AniList Community + Fallback)
  const [recordRes, relatedAnime] = await Promise.all([
    user
      ? supabase
          .from('user_anime')
          .select('status, score, progress')
          .eq('user_id', user.id)
          .eq('anime_id', anime.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchSimilarAnime(anime, 5),
  ]);

  const userAnimeRecord = recordRes.data;
  const baseUrl = 'https://animo-virid.vercel.app';
  const canonicalUrl = `${baseUrl}/anime/${slug}`;
  const pageUrl = canonicalUrl;

  const cleanedSynopsis = cleanDescription(anime.description);
  const hasRussianDescription = isRussianText(cleanedSynopsis);
  const anilistUrl = anime.anilist_id
    ? `https://anilist.co/anime/${anime.anilist_id}`
    : `https://anilist.co/search/anime?search=${encodeURIComponent(anime.title_en || displayTitle)}`;

  const isMovieFormat =
    anime.format === 'Фильм' ||
    anime.format === 'Movie' ||
    anime.format === 'MOVIE';

  const posterRaw = anime.poster_url || anime.banner_url || '';
  const posterAbsoluteUrl = posterRaw
    ? posterRaw.startsWith('http')
      ? posterRaw
      : `${baseUrl}${posterRaw}`
    : `${baseUrl}/og-image.jpg`;

  const seoTitle = `${displayTitle} — описание, рейтинг, серии | Анимо`;
  const seoDescription = extractSeoDescription(anime, displayTitle);

  return (
    <div className="flex flex-col w-full pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-32">
      {/* Native Head Document Metadata (hoisted to <head> by React 19) */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={posterAbsoluteUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={posterAbsoluteUrl} />

      {/* Schema.org JSON-LD Structured Data for Search Engine Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': isMovieFormat ? 'Movie' : 'TVSeries',
            name: displayTitle,
            alternateName: secondaryTitle || undefined,
            description: seoDescription,
            image: posterAbsoluteUrl,
            url: canonicalUrl,
            datePublished: anime.year ? `${anime.year}-01-01` : undefined,
            numberOfEpisodes: anime.episodes || undefined,
            genre: genres.map((g) => g.name_ru),
            inLanguage: 'ru',
            countryOfOrigin: {
              '@type': 'Country',
              name: 'JP',
            },
            contentRating: 'PG-13',
            ...(anime.studio
              ? {
                  productionCompany: {
                    '@type': 'Organization',
                    name: anime.studio,
                  },
                }
              : {}),
            ...(typeof anime.score === 'number' && anime.score > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: anime.score.toFixed(1),
                    bestRating: '10',
                    worstRating: '1',
                    ratingCount: Math.max(50, anime.popularity || 150).toString(),
                  },
                }
              : {}),
          }),
        }}
      />
      {/* Schema.org BreadcrumbList */}
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
                item: baseUrl,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Каталог',
                item: `${baseUrl}/catalog`,
              },
              ...(genres[0]
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: genres[0].name_ru,
                      item: `${baseUrl}/catalog?genre=${genres[0].slug}`,
                    },
                    {
                      '@type': 'ListItem',
                      position: 4,
                      name: displayTitle,
                      item: canonicalUrl,
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: displayTitle,
                      item: canonicalUrl,
                    },
                  ]),
            ],
          }),
        }}
      />

      {/* Backdrop Hero Ambient Section with Shell Bleed */}
      <div className="relative w-full -mt-16 overflow-hidden">
        {/* Atmospheric Artwork Layer */}
        <div
          className="w-full min-h-[280px] sm:min-h-[360px] lg:h-[480px] bg-cover bg-center"
          style={{
            backgroundImage: `url('${anime.banner_url || anime.poster_url || ''}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-surface-container-lowest/40" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-surface-container-lowest/50 to-surface-container-lowest" />
        </div>

        {/* Breadcrumbs - positioned at top safely below header, never overlapped by poster */}
        <div className="absolute top-0 inset-x-0 pt-20 px-4 sm:px-margin md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto z-20 pointer-events-auto">
          <nav
            aria-label="Навигация"
            className="flex items-center gap-1 text-on-surface-variant font-body-sm text-xs sm:text-body-sm overflow-x-auto whitespace-nowrap py-1 scrollbar-none touch-pan-x"
          >
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1 shrink-0 min-h-[36px] py-1 px-1 touch-manipulation"
            >
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Главная</span>
            </Link>
            <span className="text-outline shrink-0 select-none">/</span>
            <Link
              href="/catalog"
              className="hover:text-primary transition-colors shrink-0 min-h-[36px] flex items-center py-1 px-1 touch-manipulation"
            >
              <span>Каталог</span>
            </Link>
            {genres[0] && (
              <>
                <span className="text-outline shrink-0 select-none">/</span>
                <Link
                  href={`/catalog?genre=${genres[0].slug}`}
                  className="hover:text-primary transition-colors shrink-0 min-h-[36px] flex items-center py-1 px-1 touch-manipulation"
                >
                  <span>{genres[0].name_ru}</span>
                </Link>
              </>
            )}
            <span className="text-outline shrink-0 select-none">/</span>
            <span className="text-primary font-medium shrink-0 max-w-[180px] sm:max-w-xs truncate py-1 px-1">
              {displayTitle}
            </span>
          </nav>
        </div>
      </div>

      {/* Primary Media Showcase Grid (Poster + Details) */}
      <div className="relative w-full max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop -mt-16 sm:-mt-24 lg:-mt-32 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-gutter-desktop items-start">
          
          {/* Left Column: Poster Canvas & Quick Stats */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-surface-container-low group border border-outline-variant/30 max-w-[240px] sm:max-w-[280px] mx-auto lg:max-w-none w-full">
              {/* Poster Image */}
              <div className="aspect-[2/3] w-full overflow-hidden relative bg-surface-container-high">
                {anime.poster_url ? (
                  <Image
                    src={anime.poster_url}
                    alt={displayTitle}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined text-6xl">movie</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-black/30" />

                {/* Format Tag Overlay */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm shadow-md">
                  {anime.format || 'TV SERIES'}
                </div>

                {/* Score Pill Overlay */}
                {typeof anime.score === 'number' && anime.score > 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-secondary-container/90 backdrop-blur-md text-on-secondary-container font-badge-score text-badge-score flex items-center gap-1 shadow-lg shadow-secondary-container/40">
                    <span
                      className="material-symbols-outlined text-[15px] text-secondary-fixed fill-current"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span>{anime.score.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Poster Footer Score Breakdown */}
              <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-headline-sm text-headline-sm font-bold flex items-center gap-1.5 text-secondary">
                    <span
                      className="material-symbols-outlined text-[20px] text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {typeof anime.score === 'number' && anime.score > 0
                      ? `${anime.score.toFixed(1)} / 10`
                      : 'Без оценки'}
                  </span>
                  <span className="font-label-md text-label-md text-outline">
                    {anime.status === 'ongoing' ? 'В эфире' : 'Завершен'}
                  </span>
                </div>
                {typeof anime.score === 'number' && anime.score > 0 ? (
                  <>
                    <p className="font-body-sm text-body-sm text-outline">
                      Официальный рейтинг AniList сообщества
                    </p>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-gradient-to-r from-primary via-secondary to-tertiary h-full rounded-full"
                        style={{ width: `${Math.min(100, (anime.score / 10) * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-body-sm text-body-sm text-outline">
                    Оценка пока не сформирована
                  </p>
                )}
              </div>
            </div>

            {/* Metric Bento Widget */}
            <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="p-3 bg-surface-container rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Серий
                </span>
                <span className={`font-bold text-on-surface mt-1 ${anime.episodes ? 'font-headline-sm text-headline-sm' : 'text-base sm:text-headline-sm'}`}>
                  {anime.episodes ? anime.episodes : anime.status === 'ongoing' ? 'Идёт показ' : '—'}
                </span>
                <span className="font-body-sm text-body-sm text-tertiary mt-0.5">
                  {anime.status === 'ongoing' ? 'Онгоинг' : 'Полный сезон'}
                </span>
              </div>
              <div className="p-3 bg-surface-container rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Год
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">
                  {anime.year || '—'}
                </span>
                <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                  {anime.season || 'Сезон'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Metadata, Airing Banner, Tracker & Synopsis */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-space-lg">
            
            {/* Titles Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  {anime.season && (
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm uppercase">
                      {anime.season}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase">
                    {anime.format || 'ТВ СЕРИАЛ'}
                  </span>
                </div>
                <ShareButton
                  title={displayTitle}
                  description={anime.description || undefined}
                  url={pageUrl}
                />
              </div>
              <h1 className="font-headline-lg text-headline-sm sm:text-headline-lg md:text-display-hero md:font-display-hero text-on-surface tracking-tight leading-tight">
                {displayTitle}
              </h1>
              {secondaryTitle && (
                <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">
                  {secondaryTitle}{' '}
                  {anime.title_jp && anime.title_jp !== secondaryTitle && (
                    <span className="text-outline font-normal">({anime.title_jp})</span>
                  )}
                </p>
              )}
            </div>

            {/* Badges Pill Row */}
            <div className="flex flex-wrap items-center gap-space-xs text-on-surface">
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-high font-label-md text-label-md flex items-center gap-1.5 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[16px]">tv</span>
                {anime.format || 'ТВ Сериал'}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-high font-label-md text-label-md flex items-center gap-1.5 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[16px]">calendar_today</span>
                {anime.year ? `${anime.year} год` : 'Год неизвестен'}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-high font-label-md text-label-md flex items-center gap-1.5 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[16px]">layers</span>
                {anime.episodes
                  ? `${anime.episodes} серий`
                  : anime.status === 'ongoing'
                  ? 'Идёт показ'
                  : '—'}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-secondary-container/40 text-on-secondary-container font-label-md text-label-md flex items-center gap-1.5 border border-secondary/30">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {anime.status === 'ongoing' ? 'Онгоинг' : 'Завершен'}
              </div>
              {anime.studio && (
                <div className="px-3 py-1.5 rounded-xl bg-surface-container-high font-label-md text-label-md flex items-center gap-1.5 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline text-[16px]">movie_edit</span>
                  {anime.studio}
                </div>
              )}
            </div>

            {/* Airing Schedule Alert Box (calculated in viewer's local timezone) */}
            {anime.status === 'ongoing' && anime.next_episode_at && (
              <div className="p-space-md rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container-low to-surface-container-high shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-outline-variant/30">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[24px]">bolt</span>
                  </div>
                  <AiringCountdown
                    nextEpisodeAt={anime.next_episode_at}
                    airingDay={anime.airing_day}
                    mode="full"
                  />
                </div>
                <button
                  type="button"
                  className="px-space-md py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-2 transition-all shrink-0 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    notifications_active
                  </span>
                  <span>Напомнить о серии</span>
                </button>
              </div>
            )}

            {/* Tracking Status Segmented Controller */}
            <WatchStatusTracker
              animeId={anime.id}
              totalEpisodes={anime.episodes}
              isLoggedIn={Boolean(user)}
              initialStatus={userAnimeRecord?.status as any}
              initialScore={userAnimeRecord?.score}
              initialProgress={userAnimeRecord?.progress}
            />

            {/* Genre Tags Flow */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center py-1">
                <span className="font-label-md text-label-md text-outline mr-1">Жанры:</span>
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/catalog?genre=${g.slug}`}
                    className="px-3 py-1.5 rounded-full bg-surface-container font-label-md text-xs sm:text-label-md text-primary hover:bg-surface-container-high hover:text-primary-fixed transition-colors active:scale-95"
                  >
                    # {g.name_ru}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis Section */}
            <section className="p-space-lg rounded-2xl bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/20 shadow-sm">
              <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface font-semibold">
                <span className="material-symbols-outlined text-primary text-[20px]">subject</span>
                Синопсис
              </div>
              {hasRussianDescription ? (
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {cleanedSynopsis}
                </p>
              ) : (
                <div className="flex flex-col items-start gap-4 py-2">
                  <p className="font-body-lg text-body-lg text-on-surface-variant italic">
                    Описание на русском пока нет
                  </p>
                  <a
                    href={anilistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary hover:text-primary-fixed border border-outline-variant/30 font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                  >
                    <span>Читать оригинал на AniList</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                </div>
              )}
            </section>

            {/* Official Legal Streaming & Trailers */}
            <WhereToWatch
              animeId={anime.id}
              shikimoriId={anime.shikimori_id}
              anilistId={anime.anilist_id}
              titleRu={anime.title_ru}
              titleEn={anime.title_en}
              isLoggedIn={Boolean(user)}
              initialWatchStatus={userAnimeRecord?.status as any}
            />

            {/* Production & Crew Details Bento */}
            <section className="p-space-lg rounded-2xl bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/20 shadow-sm">
              <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface font-semibold mb-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
                О тайтле и производстве
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-outline font-label-sm text-label-sm block">Студия</span>
                  <span className="font-title-card text-title-card text-on-surface font-semibold">
                    {anime.studio || 'Не указана'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-outline font-label-sm text-label-sm block">Формат</span>
                  <span className="font-title-card text-title-card text-on-surface font-semibold">
                    {anime.format || 'ТВ'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-outline font-label-sm text-label-sm block">Сезон выхода</span>
                  <span className="font-title-card text-title-card text-on-surface font-semibold">
                    {anime.season && anime.season !== 'UNDEFINED'
                      ? (anime.year && !anime.season.includes(String(anime.year)) && !/\b\d{4}\b/.test(anime.season)
                          ? `${anime.season} ${anime.year}`
                          : anime.season)
                      : (anime.year || '—')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-outline font-label-sm text-label-sm block">Статус тайтла</span>
                  <span className="font-title-card text-title-card text-on-surface font-semibold">
                    {anime.status === 'ongoing' ? 'В эфире (онгоинг)' : 'Завершён'}
                  </span>
                </div>
              </div>
            </section>

            {/* Related Anime Section */}
            {relatedAnime.length > 0 && (
              <section className="flex flex-col gap-space-md pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">
                      recommend
                    </span>
                    Похожие тайтлы
                  </div>
                  <Link
                    href={`/catalog?genre=${genres[0]?.slug || 'all'}`}
                    className="font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors flex items-center gap-1"
                  >
                    <span>В каталог</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  {relatedAnime.map((item) => (
                    <AnimeCard key={item.id} anime={item} />
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
