'use client';

import { useEffect, useState } from 'react';
import { getEpisodeStatusBadge, formatAiringTime } from '@/lib/format';

interface AiringCountdownProps {
  nextEpisodeAt: string | number | null | undefined;
  airingDay?: string | null;
  mode?: 'badge' | 'full';
  displayMode?: 'calendar' | 'home';
}

export function AiringCountdown({
  nextEpisodeAt,
  mode = 'badge',
  displayMode = 'calendar',
}: AiringCountdownProps) {
  const [status, setStatus] = useState<{
    text: string;
    isPast: boolean;
    isToday: boolean;
  }>(() => getEpisodeStatusBadge(nextEpisodeAt, displayMode));

  const [formatted, setFormatted] = useState(() =>
    typeof nextEpisodeAt === 'string' ? formatAiringTime(nextEpisodeAt) : null
  );

  useEffect(() => {
    const update = () => {
      setStatus(getEpisodeStatusBadge(nextEpisodeAt, displayMode));
      if (typeof nextEpisodeAt === 'string') {
        setFormatted(formatAiringTime(nextEpisodeAt));
      }
    };

    update();
    const interval = setInterval(update, 30000); // 30 sec update
    return () => clearInterval(interval);
  }, [nextEpisodeAt, displayMode]);

  if (!nextEpisodeAt) {
    return mode === 'full' ? (
      <div className="flex flex-col">
        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          Дата выхода следующего эпизода не объявлена
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Следите за обновлениями официального расписания авторов.
        </p>
      </div>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-outline font-label-sm text-xs shrink-0">
        <span className="material-symbols-outlined text-[13px]">schedule</span>
        Дата не объявлена
      </span>
    );
  }

  if (mode === 'badge') {
    const isPast = status.isPast;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm shrink-0 font-medium ${
          isPast
            ? 'bg-surface-container-highest text-on-surface-variant'
            : 'bg-tertiary-container/30 text-tertiary'
        }`}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isPast ? 'check_circle' : 'schedule'}
        </span>
        <span>{status.text}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
        {status.isPast
          ? status.text
          : formatted?.isHiatus
          ? formatted.hiatusText
          : formatted
          ? `Выходит в ${formatted.dayName.toLowerCase()} в ${formatted.timeStr} (по вашему времени)`
          : status.text}
      </span>
      {!status.isPast && formatted?.remainingStr && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          До следующего эпизода осталось:{' '}
          <span className="font-bold text-tertiary">{formatted.remainingStr}</span>
        </p>
      )}
    </div>
  );
}
