'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AiringCountdown } from './AiringCountdown';
import { setAnimeWatchStatus } from '@/app/actions/tracker';
import { useRouter } from 'next/navigation';

interface AiringCardProps {
  id: string;
  slug?: string;
  title: string;
  episode_info?: string;
  episode_num?: number;
  studio?: string | null;
  next_episode_at?: string | null;
  format?: string | null;
  tags?: string[];
  poster_url?: string | null;
  initialInList?: boolean;
  isLoggedIn?: boolean;
}

export function AiringCard({
  slug,
  id,
  title,
  episode_info,
  episode_num,
  studio,
  next_episode_at,
  format,
  tags,
  poster_url,
  initialInList = false,
  isLoggedIn = false,
}: AiringCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [inList, setInList] = useState(initialInList);
  const [saving, setSaving] = useState(false);

  const displayTags = tags || (format ? [format] : ['Онгоинг']);

  const handleToggleList = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const nextStatus = inList ? null : 'plan';
    setInList(!inList);
    setSaving(true);
    try {
      const res = await setAnimeWatchStatus(id, nextStatus as any);
      if (res?.error) {
        setInList(inList);
      }
    } catch {
      setInList(inList);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex items-center gap-4 p-4 lg:p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-sm group border border-outline-variant/10">
      <Link
        href={`/anime/${slug || id}`}
        prefetch={true}
        className="relative w-24 h-32 lg:w-28 lg:h-36 rounded-xl overflow-hidden shrink-0 bg-surface-container-high block select-none touch-manipulation"
      >
        {poster_url && !imgError ? (
          <Image
            src={poster_url}
            alt={title}
            fill
            sizes="120px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest">
            <span className="material-symbols-outlined text-2xl text-primary/40 mb-1">filter_vintage</span>
            <span className="text-[10px] text-on-surface line-clamp-2">{title}</span>
          </div>
        )}
        {episode_num && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-[10px] text-tertiary">
            Эп. {episode_num}
          </div>
        )}
      </Link>

      <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-0.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-label-sm text-label-sm text-outline truncate">
              {studio || 'Аниме'}
            </span>
            <AiringCountdown nextEpisodeAt={next_episode_at} mode="badge" />
          </div>
          <Link href={`/anime/${slug || id}`} prefetch={true}>
            <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors font-semibold">
              {title}
            </h3>
          </Link>
          <p className="font-body-sm text-body-sm text-outline mt-0.5 truncate">
            {episode_info || (episode_num ? `Серия ${episode_num}` : 'Новый эпизод скоро')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[11px] text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleList}
              disabled={saving}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg font-label-md text-xs sm:text-label-md transition-all flex items-center gap-1 touch-manipulation active:scale-95 ${
                inList
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: inList ? "'FILL' 1" : "'FILL' 0" }}
              >
                {inList ? 'bookmark' : 'bookmark_add'}
              </span>
              <span>{inList ? 'В списке' : 'В список'}</span>
            </button>

            <Link
              href={`/anime/${slug || id}`}
              prefetch={true}
              className="min-h-[38px] flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-md text-xs sm:text-label-md transition-colors active:scale-95 touch-manipulation"
            >
              <span>Подробнее</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
