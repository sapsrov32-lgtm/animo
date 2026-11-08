'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarAiringItem } from '@/lib/anilist';
import { AiringCountdown } from '@/components/anime/AiringCountdown';
import { setAnimeWatchStatus } from '@/app/actions/tracker';
import { useRouter } from 'next/navigation';

interface CalendarCardProps {
  item: CalendarAiringItem;
  userStatus?: string | null;
  userProgress?: number;
  userTimezone?: string;
  isLoggedIn?: boolean;
}

export function CalendarCard({
  item,
  userStatus,
  userProgress = 0,
  isLoggedIn = false,
}: CalendarCardProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string | null>(userStatus || null);
  const [loading, setLoading] = useState(false);

  const displayTitle = item.titleRu || item.titleEn;
  const secondaryTitle = item.titleRu ? item.titleEn : item.titleJp;

  // Time calculations in local and Tokyo (JST) time
  const airDate = new Date(item.airingAt * 1000);
  const localTime = airDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const jstTime = airDate.toLocaleTimeString('ru-RU', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const diffMs = airDate.getTime() - now.getTime();
  const hasAired = diffMs < 0;
  const timeDiffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));

  const episodeBadgeText = item.totalEpisodes
    ? `Эп. ${item.episode} из ${item.totalEpisodes}`
    : `Эп. ${item.episode}`;

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!item.dbId) {
      // If title not yet synced to Supabase, direct to title page
      router.push(`/anime/${item.slug}`);
      return;
    }

    const nextStatus = currentStatus === 'now' ? 'plan' : currentStatus === 'plan' ? null : 'now';
    setCurrentStatus(nextStatus);
    setLoading(true);

    try {
      const res = await setAnimeWatchStatus(item.dbId, nextStatus as any);
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
      {/* Poster Thumbnail */}
      <Link
        href={`/anime/${item.slug}`}
        className="relative w-full sm:w-28 sm:h-40 h-48 rounded-xl overflow-hidden shrink-0 bg-surface-container-high block"
      >
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
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

        {/* Episode badge («Эп. 5 из 12» или «Эп. 5») */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md font-label-sm text-[10px] text-on-surface font-bold border border-outline-variant/30">
          {episodeBadgeText}
        </div>
      </Link>

      {/* Content & Metadata */}
      <div className="flex flex-col justify-between flex-1 min-w-0 gap-space-sm">
        <div className="flex flex-col gap-1">
          {/* Timing & Status Header Row: «21:00 по вашему времени / 03:00 JST» */}
          <div className="flex flex-wrap items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs font-label-md text-label-md">
              <span className="text-primary font-bold">{localTime} по вашему времени</span>
              <span className="text-outline font-normal">/ {jstTime} JST</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline font-label-sm text-[10px]">
                {item.format}
              </span>
            </div>

            {/* Episode status badge */}
            <AiringCountdown nextEpisodeAt={airDate.toISOString()} mode="badge" displayMode="calendar" />
          </div>

          {/* Anime Title & Secondary Title */}
          <Link href={`/anime/${item.slug}`}>
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

        {/* Genres (up to 3 in AniList order), Score & Watchlist Indicator */}
        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
          {item.score && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold border border-secondary/30">
              <span
                className="material-symbols-outlined text-[13px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span>{item.score.toFixed(1)}</span>
            </div>
          )}

          {item.genres.map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 rounded-md bg-surface-container-high text-outline font-label-sm text-label-sm"
            >
              {genre}
            </span>
          ))}

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
            {item.format} · Эпизод {item.episode}
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
              href={`/anime/${item.slug}`}
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
