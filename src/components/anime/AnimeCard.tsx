'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { sortAndFormatGenres } from '@/lib/genres';
import { setAnimeWatchStatus } from '@/app/actions/tracker';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

interface AnimeCardProps {
  anime: Anime;
  badge?: string;
  badgeType?: 'trend' | 'status' | 'default';
  showStudio?: boolean;
  initialBookmarked?: boolean;
}

export function AnimeCard({
  anime,
  badge,
  badgeType = 'default',
  initialBookmarked = false,
}: AnimeCardProps) {
  const { state } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  const handleQuickBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (state === 'loading') {
      return; // Do nothing while auth is resolving
    }

    if (state === 'guest') {
      setAuthModalOpen(true);
      return;
    }

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setLoading(true);

    try {
      const res = await setAnimeWatchStatus(anime.id, nextBookmarked ? 'plan' : null);
      if (res?.error === 'unauthorized') {
        setBookmarked(bookmarked);
        setAuthModalOpen(true);
        return;
      }
      if (res?.error) {
        setBookmarked(bookmarked);
      }
    } catch {
      setBookmarked(bookmarked);
    } finally {
      setLoading(false);
    }
  };

  // Extract genres (up to 3 in AniList order)
  const rawGenres =
    anime.genres?.map((g) => g.name_ru) ||
    anime.anime_genres?.map((ag) => ag.genres?.name_ru).filter(Boolean) ||
    [];
  const genresList = sortAndFormatGenres(rawGenres, 3).join(', ');

  const displayBadge =
    badge ||
    (anime.status === 'ongoing'
      ? 'Онгоинг'
      : anime.status === 'announced'
      ? 'Скоро'
      : 'Завершён');

  let episodeLabel = '';
  if (anime.status === 'ongoing') {
    episodeLabel = anime.episodes ? `Онгоинг (из ${anime.episodes})` : 'Онгоинг';
  } else if (anime.status === 'announced') {
    episodeLabel = 'Скоро';
  } else {
    if (anime.format === 'Фильм' || anime.format === 'Movie') {
      episodeLabel = 'Фильм';
    } else if (anime.episodes) {
      episodeLabel = `${anime.episodes} эп.`;
    } else {
      episodeLabel = 'Завершён';
    }
  }

  // Realistic score formatting
  const scoreVal =
    typeof anime.score === 'number' && anime.score > 0
      ? anime.score > 9.5
        ? '9.5'
        : anime.score.toFixed(1)
      : null;

  return (
    <>
      <div className="group relative flex flex-col rounded-2xl bg-surface-container-low overflow-hidden hover:bg-surface-container transition-all duration-300 hover:-translate-y-1 shadow-md border border-outline-variant/15">
        <Link
          href={`/anime/${anime.slug || anime.id}`}
          prefetch={true}
          className="relative w-full aspect-[2/3] overflow-hidden bg-surface-container-high block select-none touch-manipulation"
        >
          {/* Loading Skeleton */}
          {!imgLoaded && !imgError && anime.poster_url && (
            <div className="absolute inset-0 bg-surface-container-high animate-pulse z-0" />
          )}

          {anime.poster_url && !imgError ? (
            <Image
              src={anime.poster_url}
              alt={displayTitle}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              unoptimized
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
            />
          ) : (
            /* Graceful stylized poster fallback */
            <div className="w-full h-full flex flex-col items-center justify-between p-3.5 text-center bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest border-b border-outline-variant/20">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest/60 flex items-center justify-center text-secondary mt-2">
                <span className="material-symbols-outlined text-[18px]">movie</span>
              </div>
              <div className="flex flex-col gap-1 w-full my-auto">
                <span className="font-label-md text-xs sm:text-sm text-on-surface line-clamp-3 font-semibold px-1">
                  {displayTitle}
                </span>
                {secondaryTitle && (
                  <span className="font-body-xs text-[10px] text-outline line-clamp-1">
                    {secondaryTitle}
                  </span>
                )}
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] text-primary uppercase font-bold tracking-wider">
                {anime.format || 'Аниме'}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent pointer-events-none" />

          {/* Top Badges Bar */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none z-10">
            {scoreVal ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-secondary-fixed font-badge-score text-badge-score shadow-sm">
                <span
                  className="material-symbols-outlined text-[14px] text-secondary fill-current"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span>{scoreVal}</span>
              </div>
            ) : (
              <div />
            )}

            <span
              className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase shadow-sm backdrop-blur-md ${
                badgeType === 'trend'
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'bg-surface-container-lowest/85 text-on-surface'
              }`}
            >
              {displayBadge}
            </span>
          </div>

          {/* Interactive Quick Bookmark Button (>= 44x44px touch target) */}
          <button
            type="button"
            onClick={handleQuickBookmark}
            disabled={state === 'loading'}
            aria-label={bookmarked ? 'Удалить из списка' : 'Добавить в список'}
            className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg touch-manipulation active:scale-90 ${
              bookmarked
                ? 'bg-secondary text-on-secondary shadow-secondary/30'
                : 'bg-surface-container-lowest/85 backdrop-blur-md text-on-surface hover:text-secondary hover:bg-surface-container-high'
            }`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
              >
                {bookmarked ? 'bookmark' : 'bookmark_border'}
              </span>
            )}
          </button>
        </Link>

        {/* Meta Content */}
        <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-1">
          <div>
            <span className="font-label-sm text-[11px] text-outline block truncate">
              {secondaryTitle || anime.format || 'Аниме'}
            </span>
            <Link href={`/anime/${anime.slug || anime.id}`} prefetch={true}>
              <h3 className="font-title-card text-title-card font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                {displayTitle}
              </h3>
            </Link>
            {anime.title_jp && anime.title_jp !== displayTitle && anime.title_jp !== secondaryTitle && (
              <span className="text-[10px] text-outline/80 block truncate font-normal mt-0.5">
                {anime.title_jp}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-outline font-body-sm text-[11px] pt-1 border-t border-outline-variant/10">
            <span className="truncate max-w-[110px]">{genresList || 'Аниме'}</span>
            <span className="font-medium text-on-surface-variant shrink-0">{episodeLabel}</span>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
