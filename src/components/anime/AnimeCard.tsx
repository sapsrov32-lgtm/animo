'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';

interface AnimeCardProps {
  anime: Anime;
  badge?: string;
  badgeType?: 'trend' | 'status' | 'default';
  showStudio?: boolean;
}

export function AnimeCard({
  anime,
  badge,
  badgeType = 'default',
}: AnimeCardProps) {
  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  // Extract genres from either direct genres array or anime_genres join
  const genresList = (
    anime.genres?.map((g) => g.name_ru) ||
    anime.anime_genres?.map((ag) => ag.genres?.name_ru).filter(Boolean) ||
    []
  )
    .slice(0, 2)
    .join(', ');

  const displayBadge = badge || (anime.status === 'ongoing' ? 'Онгоинг' : 'Завершен');

  return (
    <div className="group relative flex flex-col rounded-2xl bg-surface-container-low overflow-hidden hover:bg-surface-container transition-all duration-300 hover:-translate-y-1 shadow-md">
      <Link
        href={`/anime/${anime.slug || anime.id}`}
        className="relative w-full aspect-[2/3] overflow-hidden bg-surface-container-high block"
      >
        {anime.poster_url ? (
          <Image
            src={anime.poster_url}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline bg-surface-container">
            <span className="material-symbols-outlined text-4xl">movie</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />

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
          {anime.score && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary font-badge-score text-badge-score">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              {anime.score.toFixed(1)}
            </span>
          )}
        </div>

        {/* Quick Add Hover Overlay Button */}
        <button
          type="button"
          aria-label="Сохранить в список"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/login';
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-surface-container-highest/90 hover:bg-primary-container hover:text-on-primary-container text-on-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
        </button>
      </Link>

      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <span className="text-[11px] font-label-sm text-outline tracking-wider block truncate">
            {secondaryTitle || anime.studio || (anime.year ? `${anime.year} г.` : 'Аниме')}
          </span>
          <Link href={`/anime/${anime.slug || anime.id}`}>
            <h3 className="font-title-card text-title-card text-on-surface group-hover:text-primary-fixed transition-colors line-clamp-1">
              {displayTitle}
            </h3>
          </Link>
        </div>
        <div className="flex items-center justify-between text-outline font-body-sm text-body-sm pt-1">
          <span className="truncate">{genresList || `${anime.year || 2024} г.`}</span>
          <span className="text-tertiary font-label-sm text-[11px] shrink-0">
            {anime.episodes ? `${anime.episodes} эп.` : (anime.status === 'ongoing' ? 'Онгоинг' : 'Завершен')}
          </span>
        </div>
      </div>
    </div>
  );
}
