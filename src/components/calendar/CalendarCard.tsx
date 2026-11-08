'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { AiringCountdown } from '@/components/anime/AiringCountdown';
import { setAnimeWatchStatus } from '@/app/actions/tracker';
import { useRouter } from 'next/navigation';

interface CalendarCardProps {
  anime: Anime;
  userStatus?: string | null;
  userProgress?: number;
  userTimezone?: string;
  isLoggedIn?: boolean;
}

export function CalendarCard({
  anime,
  userStatus,
  userProgress = 0,
  isLoggedIn = false,
}: CalendarCardProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string | null>(userStatus || null);
  const [loading, setLoading] = useState(false);

  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  // Time calculations
  let localTime = 'Дата не объявлена';
  let jstTime = '—';
  let hasAired = false;
  let timeDiffHours = 0;

  if (anime.next_episode_at) {
    const airDate = new Date(anime.next_episode_at);
    localTime = airDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    jstTime = airDate.toLocaleTimeString('ru-RU', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const now = new Date();
    const diffMs = airDate.getTime() - now.getTime();
    if (diffMs < 0) {
      hasAired = true;
      timeDiffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
    }
  }

  // Genre pill
  const firstGenre =
    anime.genres?.[0]?.name_ru ||
    anime.anime_genres?.[0]?.genres?.name_ru ||
    'Аниме';

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const nextStatus = currentStatus === 'now' ? 'plan' : currentStatus === 'plan' ? null : 'now';
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
    <article className="group relative flex flex-col sm:flex-row items-stretch gap-space-md p-space-md rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all shadow-md border border-outline-variant/20 hover:border-outline-variant/40">
      {/* Poster Thumbnail 2:3 */}
      <Link
        href={`/anime/${anime.slug || anime.id}`}
        className="relative w-full sm:w-28 sm:h-40 h-48 rounded-xl overflow-hidden shrink-0 bg-surface-container-high block"
      >
        {anime.poster_url ? (
          <Image
            src={anime.poster_url}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, 120px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-3xl">movie</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent sm:hidden" />
        
        {/* Episode badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md font-label-sm text-[10px] text-on-surface font-bold border border-outline-variant/30">
          {anime.episodes ? `Эп. ? / ${anime.episodes}` : 'Онгоинг'}
        </div>
      </Link>

      {/* Content & Metadata */}
      <div className="flex flex-col justify-between flex-1 min-w-0 gap-space-sm">
        <div className="flex flex-col gap-1">
          {/* Timing & Status Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs font-label-md text-label-md">
              <span className="text-primary font-bold">{localTime} Местное</span>
              <span className="text-outline font-normal">/ {jstTime} JST</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline font-label-sm text-[10px]">
                Телеэфир
              </span>
            </div>

            {/* Countdown / Aired status pill */}
            {hasAired ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                <span>Вышло {timeDiffHours > 0 ? `${timeDiffHours} ч. назад` : 'недавно'}</span>
              </div>
            ) : anime.next_episode_at ? (
              <AiringCountdown nextEpisodeAt={anime.next_episode_at} mode="badge" />
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline font-label-sm text-[11px]">
                Расписание уточняется
              </span>
            )}
          </div>

          {/* Anime Title & Secondary Title */}
          <Link href={`/anime/${anime.slug || anime.id}`}>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors truncate">
              {displayTitle}
            </h3>
          </Link>
          {secondaryTitle && (
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {secondaryTitle}
            </p>
          )}
        </div>

        {/* Tags, Studio, Score & Watchlist Indicator */}
        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
          {anime.score && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold border border-secondary/30">
              <span
                className="material-symbols-outlined text-[13px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span>{anime.score.toFixed(1)}</span>
            </div>
          )}

          {anime.studio && (
            <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {anime.studio}
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-outline font-label-sm text-label-sm">
            {firstGenre}
          </span>

          {currentStatus && (
            <div className="flex items-center gap-1.5 text-tertiary font-body-sm text-[11px] ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              <span>
                В вашем списке: {currentStatus === 'now' ? 'Смотрю' : 'В планах'}
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons & Format */}
        <div className="flex items-center justify-between gap-space-sm pt-space-xs border-t border-surface-container-highest/50">
          <span className="font-body-sm text-body-sm text-outline">
            {anime.format || 'ТВ Сериал'}
          </span>

          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={handleToggleWatchlist}
              disabled={loading}
              className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                currentStatus
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'bg-primary-container/20 hover:bg-primary-container text-primary hover:text-on-primary-container'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={currentStatus ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {currentStatus ? 'bookmark_added' : 'bookmark_add'}
              </span>
              <span>{currentStatus ? 'В списке' : 'Добавить в планы'}</span>
            </button>

            <Link
              href={`/anime/${anime.slug || anime.id}`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all"
              title="Перейти к странице тайтла"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
