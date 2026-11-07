'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { setAnimeWatchStatus } from '@/app/actions/tracker';

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
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  const handleQuickBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setLoading(true);

    try {
      const res = await setAnimeWatchStatus(anime.id, nextBookmarked ? 'plan' : null);
      if (res?.error === 'unauthorized') {
        setBookmarked(bookmarked);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
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

  // Extract genres from either direct genres array or anime_genres join
  const genresList = (
    anime.genres?.map((g) => g.name_ru) ||
    anime.anime_genres?.map((ag) => ag.genres?.name_ru).filter(Boolean) ||
    []
  )
    .slice(0, 2)
    .join(', ');

  const displayBadge = badge || (anime.status === 'ongoing' ? 'Онгоинг' : (anime.status === 'announced' ? 'Анонс' : 'Завершен'));
  const scoreVal = typeof anime.score === 'number' && anime.score > 0
    ? (anime.score > 9.5 ? '9.5' : anime.score.toFixed(1))
    : null;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-surface-container-low overflow-hidden hover:bg-surface-container transition-all duration-300 hover:-translate-y-1 shadow-md">
      <Link
        href={`/anime/${anime.slug || anime.id}`}
        prefetch={true}
        className="relative w-full aspect-[2/3] overflow-hidden bg-surface-container-high block select-none touch-manipulation"
      >
        {anime.poster_url && !imgError ? (
          <Image
            src={anime.poster_url}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest">
            <span className="material-symbols-outlined text-4xl text-primary/40 mb-2">filter_vintage</span>
            <span className="font-label-sm text-xs text-on-surface line-clamp-3 font-medium">
              {displayTitle}
            </span>
            <span className="font-label-sm text-[10px] text-outline mt-1 uppercase">
              {anime.format || 'Аниме'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent pointer-events-none" />

        {/* Badges top row */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wide backdrop-blur-md ${
              badgeType === 'trend'
                ? 'bg-secondary-container/90 text-on-secondary-container'
                : 'bg-surface-container-highest/80 text-on-surface-variant'
            }`}
          >
            {displayBadge}
          </span>
          {scoreVal && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary font-badge-score text-badge-score">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              {scoreVal}
            </span>
          )}
        </div>

        {/* Quick Add Hover Overlay Button */}
        <button
          type="button"
          aria-label={bookmarked ? 'Удалить из списка' : 'Добавить в планы'}
          onClick={handleQuickBookmark}
          disabled={loading}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 touch-manipulation ${
            bookmarked
              ? 'bg-primary text-on-primary opacity-100'
              : 'bg-surface-container-highest/90 hover:bg-primary-container hover:text-on-primary-container text-on-surface opacity-0 group-hover:opacity-100'
          }`}
          title={bookmarked ? 'В вашем списке (нажмите для отмены)' : 'Добавить в планы'}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {bookmarked ? 'bookmark_added' : 'bookmark_add'}
          </span>
        </button>
      </Link>

      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <span className="text-[11px] font-label-sm text-outline tracking-wider block truncate">
            {secondaryTitle || anime.studio || (anime.year ? `${anime.year} г.` : 'Аниме')}
          </span>
          <Link href={`/anime/${anime.slug || anime.id}`} prefetch={true}>
            <h3 className="font-title-card text-title-card text-on-surface group-hover:text-primary-fixed transition-colors line-clamp-1">
              {displayTitle}
            </h3>
          </Link>
        </div>
        <div className="flex items-center justify-between text-outline font-body-sm text-body-sm pt-1">
          <span className="truncate">{genresList || `${anime.year || 2024} г.`}</span>
          <span className="text-tertiary font-label-sm text-[11px] shrink-0">
            {anime.episodes ? `${anime.episodes} эп.` : (anime.status === 'ongoing' ? 'Онгоинг' : (anime.status === 'announced' ? 'Скоро' : 'Завершен'))}
          </span>
        </div>
      </div>
    </div>
  );
}
