'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WatchStatus } from '@/types';
import { setAnimeWatchStatus, setAnimeScore, setAnimeProgress } from '@/app/actions/tracker';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

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
  const { state, user } = useAuth();
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus);
  const [score, setScore] = useState<number | null>(initialScore);
  const [progress, setProgress] = useState<number>(initialProgress);
  const [isSaving, setIsSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Synchronize status from client Supabase when user is logged in
  useEffect(() => {
    if (state !== 'user' || !user) return;
    let isMounted = true;
    const supabase = createClient();
    supabase
      .from('user_anime')
      .select('status, score, progress')
      .eq('user_id', user.id)
      .eq('anime_id', animeId)
      .maybeSingle()
      .then((res: any) => {
        const record = res?.data;
        if (!isMounted || !record) return;
        setStatus(record.status as WatchStatus);
        setScore(record.score);
        setProgress(record.progress || 0);
      });

    return () => {
      isMounted = false;
    };
  }, [animeId, state, user]);

  const ensureAuthenticated = useCallback((): boolean => {
    return state === 'user' && Boolean(user);
  }, [state, user]);

  const handleStatusChange = async (newStatus: WatchStatus) => {
    const authed = await ensureAuthenticated();
    if (!authed) {
      setAuthModalOpen(true);
      return;
    }

    const targetStatus = status === newStatus ? null : newStatus;
    const prevStatus = status;

    // Оптимистичное обновление UI сразу же
    setStatus(targetStatus);
    setIsSaving(true);

    try {
      const res = await setAnimeWatchStatus(animeId, targetStatus, score, progress);
      if (res?.error) {
        // Запасной вариант: прямое сохранение через клиент Supabase при задержке cookie
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (targetStatus === null) {
            await supabase
              .from('user_anime')
              .delete()
              .eq('user_id', userData.user.id)
              .eq('anime_id', animeId);
          } else {
            await supabase.from('user_anime').upsert(
              {
                user_id: userData.user.id,
                anime_id: animeId,
                status: targetStatus,
                score,
                progress,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,anime_id' }
            );
          }
        } else {
          setStatus(prevStatus);
        }
      }
    } catch (err) {
      console.error('Error setting status:', err);
      setStatus(prevStatus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = async (newScore: number) => {
    const authed = await ensureAuthenticated();
    if (!authed) {
      setAuthModalOpen(true);
      return;
    }

    const targetScore = score === newScore ? null : newScore;
    const prevScore = score;

    // Оптимистичное обновление
    setScore(targetScore);
    if (!status) {
      setStatus('done');
    }
    setIsSaving(true);

    try {
      const res = await setAnimeScore(animeId, targetScore);
      if (res?.error) {
        // Прямое сохранение через клиент Supabase при необходимости
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from('user_anime').upsert(
            {
              user_id: userData.user.id,
              anime_id: animeId,
              status: status || 'done',
              score: targetScore,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,anime_id' }
          );
        } else {
          setScore(prevScore);
        }
      }
    } catch (err) {
      setScore(prevScore);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressChange = async (delta: number) => {
    const authed = await ensureAuthenticated();
    if (!authed) {
      setAuthModalOpen(true);
      return;
    }

    const max = totalEpisodes || 999;
    const nextProgress = Math.max(0, Math.min(max, progress + delta));
    const prevProgress = progress;

    setProgress(nextProgress);
    try {
      const res = await setAnimeProgress(animeId, nextProgress);
      if (res?.error) {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from('user_anime').upsert(
            {
              user_id: userData.user.id,
              anime_id: animeId,
              progress: nextProgress,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,anime_id' }
          );
        } else {
          setProgress(prevProgress);
        }
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
                {progress} / {totalEpisodes ? `${totalEpisodes} серий` : 'идёт показ'}
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
          <div className="flex items-center gap-0.5 overflow-x-auto py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleScoreChange(star)}
                className={`text-[22px] min-w-[26px] h-8 flex items-center justify-center leading-none transition-transform hover:scale-125 focus:outline-none touch-manipulation active:scale-95 ${
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
          <span className="material-symbols-outlined text-[18px] text-primary">cloud_done</span>
          <span>Автосохранение в аккаунт</span>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
