'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WatchStatus } from '@/types';
import { setAnimeWatchStatus, setAnimeScore, setAnimeProgress } from '@/app/actions/tracker';

interface WatchStatusTrackerProps {
  animeId: string;
  initialStatus?: WatchStatus | null;
  initialScore?: number | null;
  initialProgress?: number;
  totalEpisodes?: number | null;
  isLoggedIn?: boolean;
}

export function WatchStatusTracker({
  animeId,
  initialStatus = null,
  initialScore = null,
  initialProgress = 0,
  totalEpisodes = 24,
  isLoggedIn = false,
}: WatchStatusTrackerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus);
  const [score, setScore] = useState<number | null>(initialScore);
  const [progress, setProgress] = useState<number>(initialProgress);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const targetStatus = status === newStatus ? null : newStatus;
    const prevStatus = status;

    // Optimistic update
    setStatus(targetStatus);
    setIsSaving(true);

    try {
      const res = await setAnimeWatchStatus(animeId, targetStatus, score, progress);
      if (res?.error) {
        setStatus(prevStatus);
        console.error('Failed to update anime status:', res.error);
      }
    } catch (err) {
      setStatus(prevStatus);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = async (newScore: number) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const targetScore = score === newScore ? null : newScore;
    const prevScore = score;

    // Optimistic update
    setScore(targetScore);
    if (!status) {
      setStatus('done');
    }
    setIsSaving(true);

    try {
      const res = await setAnimeScore(animeId, targetScore);
      if (res?.error) {
        setScore(prevScore);
      }
    } catch (err) {
      setScore(prevScore);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressChange = async (delta: number) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const max = totalEpisodes || 999;
    const nextProgress = Math.max(0, Math.min(max, progress + delta));
    const prevProgress = progress;

    setProgress(nextProgress);
    try {
      const res = await setAnimeProgress(animeId, nextProgress);
      if (res?.error) {
        setProgress(prevProgress);
      }
    } catch (err) {
      setProgress(prevProgress);
      console.error(err);
    }
  };

  return (
    <div className="p-space-lg rounded-2xl bg-surface-container-low flex flex-col gap-space-md shadow-md border border-outline-variant/20 relative">
      {isSaving && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-[11px] text-primary animate-pulse font-label-sm">
          <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
          Сохранение...
        </span>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
          Статус в моей коллекции
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-outline">sync</span>
          {isLoggedIn ? 'Синхронизировано с аккаунтом' : 'Войдите для сохранения'}
        </span>
      </div>

      {/* Status Segmented Controller */}
      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => handleStatusChange('plan')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            status === 'plan'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={status === 'plan' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            bookmark
          </span>
          <span>В планах</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('now')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            status === 'now'
              ? 'bg-secondary-container text-on-secondary-container shadow-md shadow-secondary/20 font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={status === 'now' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            play_circle
          </span>
          <span>Смотрю</span>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('done')}
          className={`px-4 py-3 rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            status === 'done'
              ? 'bg-surface-container-highest text-on-surface shadow-md font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            check_circle
          </span>
          <span>Просмотрено</span>
        </button>
      </div>

      {/* Episode Progress Stepper (Visible if user is watching) */}
      {status === 'now' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface-container-lowest/80 gap-3 border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">movie</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline">Прогресс серий</span>
              <span className="font-title-card text-title-card font-bold text-on-surface">
                {progress} / {totalEpisodes || '?'} серий
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleProgressChange(-1)}
              disabled={progress <= 0}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright disabled:opacity-40 flex items-center justify-center text-on-surface transition-colors"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => handleProgressChange(1)}
              className="px-3 h-8 rounded-lg bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-label-sm font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
            >
              <span>+1 серия</span>
            </button>
          </div>
        </div>
      )}

      {/* Personal Rating Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-space-xs gap-space-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body-md text-body-md text-on-surface">Моя оценка:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleScoreChange(star)}
                className={`text-[22px] leading-none transition-transform hover:scale-125 focus:outline-none p-0.5 ${
                  score && score >= star
                    ? 'text-secondary font-bold'
                    : 'text-outline/30 hover:text-secondary'
                }`}
                title={`Оценка ${star} из 10`}
              >
                ★
              </button>
            ))}
          </div>
          {score && (
            <span className="font-headline-sm text-headline-sm font-bold text-secondary ml-1.5">
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
