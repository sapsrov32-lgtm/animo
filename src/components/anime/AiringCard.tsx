'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AiringCountdown } from './AiringCountdown';

interface AiringCardProps {
  id: string;
  slug?: string;
  title: string;
  episode_info?: string;
  episode_num?: number;
  studio?: string | null;
  next_episode_at?: string | null;
  tags?: string[];
  poster_url?: string | null;
}

export function AiringCard({
  slug,
  id,
  title,
  episode_info,
  episode_num,
  studio,
  next_episode_at,
  tags = ['Субтитры', 'Озвучка'],
  poster_url,
}: AiringCardProps) {
  return (
    <div className="relative flex items-center gap-4 p-4 lg:p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-sm group">
      <Link
        href={`/anime/${slug || id}`}
        className="relative w-24 h-32 lg:w-28 lg:h-36 rounded-xl overflow-hidden shrink-0 bg-surface-container-high block"
      >
        {poster_url && (
          <Image
            src={poster_url}
            alt={title}
            fill
            sizes="120px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
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
          <Link href={`/anime/${slug || id}`}>
            <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="font-body-sm text-body-sm text-outline mt-0.5 truncate">
            {episode_info || (episode_num ? `Серия ${episode_num}` : 'Новый эпизод скоро')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[11px] text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            aria-label="Напомнить о релизе"
            type="button"
            onClick={() => {
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">notifications_none</span>
            <span className="hidden sm:inline">Напомнить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
