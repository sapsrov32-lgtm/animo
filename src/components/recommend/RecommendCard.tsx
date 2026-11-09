'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle, cleanDescription, isRussianText } from '@/lib/format';
import { setAnimeWatchStatus } from '@/app/actions/tracker';
import { useRouter } from 'next/navigation';

interface RecommendCardProps {
  anime: Anime;
  matchedCriteriaText: string;
  isExactMatch?: boolean;
  userStatus?: string | null;
  isLoggedIn?: boolean;
}

export function RecommendCard({
  anime,
  matchedCriteriaText,
  isExactMatch = true,
  userStatus = null,
  isLoggedIn = false,
}: RecommendCardProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string | null>(userStatus);
  const [loading, setLoading] = useState(false);

  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  const genresList = (
    anime.genres?.map((g) => g.name_ru) ||
    anime.anime_genres?.map((ag: any) => ag.genres?.name_ru).filter(Boolean) ||
    []
  )
    .slice(0, 3)
    .join(', ');

  const hasRussianDesc = isRussianText(anime.description);
  const cleanedDesc = hasRussianDesc ? cleanDescription(anime.description) : null;
  const fallbackInfo = [
    genresList,
    anime.year ? `${anime.year} год` : null,
    anime.episodes ? `${anime.episodes} серий` : anime.status === 'ongoing' ? 'Идёт показ' : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const nextStatus = currentStatus === 'plan' ? null : 'plan';
    setCurrentStatus(nextStatus);
    setLoading(true);

    try {
      const res = await setAnimeWatchStatus(anime.id, nextStatus as any);
      if (res?.error) {
        setCurrentStatus(currentStatus);
      }
    } catch {
      setCurrentStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="bg-surface-container-low rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.65),0_0_24px_0_rgba(124,58,237,0.2)] border border-outline-variant/20 hover:border-outline-variant/40">
      {/* Banner / Poster Thumbnail 16:10 */}
      <Link
        href={`/anime/${anime.slug || anime.id}`}
        className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container-high block"
      >
        {anime.banner_url || anime.poster_url ? (
          <Image
            src={anime.banner_url || anime.poster_url || ''}
            alt={displayTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-4xl">movie</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md font-label-sm text-label-sm text-tertiary">
            {anime.format || 'ТВ'} {anime.episodes ? `• ${anime.episodes} ЭП.` : ''}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full backdrop-blur-md font-label-sm text-label-sm font-semibold border ${
              isExactMatch
                ? 'bg-secondary-container/90 text-on-secondary-container border-secondary/40'
                : 'bg-surface-container-high/90 text-on-surface-variant border-outline-variant/30'
            }`}
          >
            {isExactMatch ? 'Точный матч' : 'Частичное совпадение'}
          </span>
        </div>

        {anime.score && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/80 backdrop-blur-md text-on-secondary-container font-badge-score text-badge-score shadow-md">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span>{anime.score.toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Content & Metadata */}
      <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md -mt-4 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-body-sm text-body-sm text-outline">
              {[anime.studio, anime.year].filter(Boolean).join(' • ') || 'Аниме'}
            </span>
            {genresList && (
              <>
                <span className="text-outline">•</span>
                <span className="font-body-sm text-body-sm text-primary truncate max-w-[180px]">
                  {genresList}
                </span>
              </>
            )}
          </div>

          <Link href={`/anime/${anime.slug || anime.id}`}>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors line-clamp-1">
              {displayTitle}
            </h3>
          </Link>

          {secondaryTitle && (
            <p className="font-body-sm text-[12px] text-outline line-clamp-1 -mt-1">
              {secondaryTitle}
            </p>
          )}

          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
            {cleanedDesc || fallbackInfo || 'Информация о тайтле дополняется.'}
          </p>
        </div>

        {/* Real Match Rationale Box */}
        <div className="bg-surface-container rounded-xl p-3 flex flex-col gap-1 border border-outline-variant/10">
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span className="font-bold">Совпало:</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface leading-snug font-medium">
            {matchedCriteriaText}
          </p>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/60">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                anime.status === 'ongoing' ? 'bg-tertiary animate-pulse' : 'bg-secondary'
              }`}
            />
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {anime.status === 'ongoing' ? 'В эфире (онгоинг)' : 'Завершён'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleWatchlist}
            disabled={loading}
            className={`watchlist-btn px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
              currentStatus
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={currentStatus ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {currentStatus ? 'bookmark_added' : 'bookmark_add'}
            </span>
            <span>{currentStatus ? 'В списке' : 'В список'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
