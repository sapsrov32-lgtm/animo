import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Anime, Genre } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { sortAndFormatGenres } from '@/lib/genres';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AiringCountdown } from '@/components/anime/AiringCountdown';
import { WatchStatusTracker } from '@/components/anime/WatchStatusTracker';
import { WhereToWatch } from '@/components/anime/WhereToWatch';

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
    .select('*, anime_genres(genres(*))')
    .eq('is_published', true)
    .eq('is_adult', false);

  if (isUuid) {
    query = query.or(`slug.eq.${slug},id.eq.${slug}`);
  } else {
    query = query.eq('slug', slug);
  }
  const { data } = await query.maybeSingle();
  if (data) {
    if (data.is_adult) return null;
    const genreSlugs = data.anime_genres?.map((ag: any) => ag.genres?.slug?.toLowerCase()) || [];
    if (genreSlugs.includes('hentai')) return null;
  }
  return data;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getAnime(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app';

  if (!anime) {
    return { title: 'Тайтл не найден — Анимо' };
  }

  const title = getDisplayTitle(anime);
  const seoTitle = `${title}: описание, рейтинг, серии | Анимо`;
  const yearStr = anime.year ? `(${anime.year})` : '';
  const seoDescription = `${title} ${yearStr} — подробное описание сюжета, официальный рейтинг сообщества, список персонажей и расписание выхода серий в каталоге Анимо. ${anime.description?.slice(0, 100) || ''}`.trim();
  const pageUrl = `${baseUrl}/anime/${anime.slug || anime.id}`;
  const poster = anime.poster_url || anime.banner_url || '';

  return {
    title: {
      absolute: seoTitle,
    },
    description: seoDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: pageUrl,
      siteName: 'Анимо',
      locale: 'ru_RU',
      type: 'website',
      images: poster
        ? [
            {
              url: poster,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: poster ? [poster] : [],
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

  // Параллельный запрос сохранённого статуса и похожих аниме
  const [recordRes, relatedRes] = await Promise.all([
    user
      ? supabase
          .from('user_anime')
          .select('status, score, progress')
          .eq('user_id', user.id)
          .eq('anime_id', anime.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    firstGenreId
      ? supabase
          .from('anime')
          .select('*, anime_genres!inner(genre_id, genres!inner(*))')
          .eq('anime_genres.genre_id', firstGenreId)
          .neq('id', anime.id)
          .eq('is_published', true)
          .eq('is_adult', false)
          .limit(5)
      : supabase
          .from('anime')
          .select('*, anime_genres(genres(*))')
          .neq('id', anime.id)
          .eq('is_published', true)
          .eq('is_adult', false)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(5),
  ]);

  const userAnimeRecord = recordRes.data;
  const relatedAnime: Anime[] = (relatedRes.data as Anime[]) || [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app';
  const pageUrl = `${baseUrl}/anime/${anime.slug || anime.id}`;

  const isMovieFormat =
    anime.format === 'Фильм' ||
    anime.format === 'Movie' ||
    anime.format === 'MOVIE';

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Schema.org JSON-LD Structured Data for Search Engine Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': isMovieFormat ? 'Movie' : 'TVSeries',
            name: displayTitle,
            alternateName: secondaryTitle || undefined,
            description: anime.description || `${displayTitle} — описание сюжета, рейтинг сообщества и график выхода серий на Анимо`,
            image: anime.poster_url || anime.banner_url || undefined,
            url: pageUrl,
            datePublished: anime.year ? `${anime.year}-01-01` : undefined,
            numberOfEpisodes: anime.episodes || undefined,
            genre: genres.map((g) => g.name_ru),
            ...(typeof anime.score === 'number' && anime.score > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: anime.score.toFixed(1),
                    bestRating: '10',
                    worstRating: '1',
                    ratingCount: '150',
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Backdrop Hero Ambient Section with Shell Bleed */}
      <div className="relative w-full -mt-16 overflow-hidden">
        {/* Atmospheric Artwork Layer */}
        <div
          className="w-full min-h-[260px] sm:min-h-[360px] lg:h-[500px] bg-cover bg-center"
          style={{
            backgroundImage: `url('${anime.banner_url || anime.poster_url || ''}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-surface-container-lowest/40" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-surface-container-lowest/50 to-surface-container-lowest" />
        </div>

        {/* Breadcrumbs */}
        <div className="absolute inset-0 pt-20 px-margin md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto flex flex-col justify-end pb-8 pointer-events-none">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm pointer-events-auto mb-4 overflow-x-auto">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Главная
            </Link>
            <span className="text-outline">/</span>
            <Link href="/catalog" className="hover:text-primary transition-colors">
              Каталог
            </Link>
            {genres[0] && (
              <>
                <span className="text-outline">/</span>
                <Link
                  href={`/catalog?genre=${genres[0].slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {genres[0].name_ru}
                </Link>
              </>
            )}
            <span className="text-outline">/</span>
            <span className="text-primary truncate max-w-[240px] sm:max-w-none">
              {displayTitle}
            </span>
          </nav>
        </div>
      </div>

      {/* Primary Media Showcase Grid (Poster + Details) */}
      <div className="relative w-full max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop -mt-24 lg:-mt-32 z-10">
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
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">
                  {anime.episodes || '?'}
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {anime.season && (
                  <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm uppercase">
                    {anime.season}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase">
                  {anime.format || 'ТВ СЕРИАЛ'}
                </span>
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
                {anime.episodes ? `${anime.episodes} серий` : 'Серии уточняются'}
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
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-label-md text-label-md text-outline mr-1">Жанры:</span>
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/catalog?genre=${g.slug}`}
                    className="px-3 py-1 rounded-full bg-surface-container font-label-md text-label-md text-primary hover:bg-surface-container-high hover:text-primary-fixed transition-colors"
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
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                {anime.description || 'Описание этого тайтла ещё дополняется редакторами каталога.'}
              </p>
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
                    {anime.season ? `${anime.season}${anime.year ? ` ${anime.year}` : ''}` : anime.year || '—'}
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
