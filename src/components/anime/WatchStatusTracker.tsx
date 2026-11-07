'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WatchStatus } from '@/types';

interface WatchStatusTrackerProps {
  animeId: string;
  initialStatus?: WatchStatus | null;
  initialScore?: number | null;
  initialProgress?: number;
  totalEpisodes?: number | null;
  isLoggedIn?: boolean;
}

export function WatchStatusTracker({
  totalEpisodes = 24,
  isLoggedIn = false,
}: WatchStatusTrackerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const handleStatusChange = (newStatus: WatchStatus) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setStatus(newStatus);
  };

  const handleScoreChange = (newScore: number) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setScore(newScore);
  };

  return (
    <div className="p-space-lg rounded-2xl bg-surface-container-low flex flex-col gap-space-md shadow-md border border-outline-variant/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
          Статус в моей коллекции
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-outline">sync</span>
          Синхронизировано с трекером
        </span>
      </div>

      {/* Status Segmented Controller */}
      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => handleStatusChange('plan')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
            status === 'plan'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bookmark</span>
          <span>В планах</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('now')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
            status === 'now'
              ? 'bg-secondary-container text-on-secondary-container shadow-md shadow-secondary/20 font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Смотрю</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('done')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
            status === 'done'
              ? 'bg-surface-container-highest text-on-surface shadow-md font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Просмотрено</span>
        </button>
      </div>

      {/* Personal Rating Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-space-xs gap-space-sm">
        <div className="flex items-center gap-2">
          <span className="font-body-md text-body-md text-on-surface">Моя оценка:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleScoreChange(star)}
                className={`text-[20px] transition-transform hover:scale-125 focus:outline-none ${
                  score && score >= star ? 'text-secondary font-bold' : 'text-outline/40 hover:text-secondary'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {score && (
            <span className="font-headline-sm text-headline-sm font-bold text-secondary ml-1">
              {score} / 10
            </span>
          )}
        </div>

        <div className="flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Каталог без видеоплеера и рекламы</span>
        </div>
      </div>
    </div>
  );
}
