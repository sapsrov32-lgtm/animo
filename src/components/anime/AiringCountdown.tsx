'use client';

import { useEffect, useState } from 'react';
import { formatAiringTime, getAiringScheduleDisplay } from '@/lib/format';

interface AiringCountdownProps {
  nextEpisodeAt: string | null | undefined;
  airingDay?: string | null;
  mode?: 'badge' | 'full';
}

export function AiringCountdown({ nextEpisodeAt, mode = 'badge' }: AiringCountdownProps) {
  const [scheduleStr, setScheduleStr] = useState<string>('');
  const [formatted, setFormatted] = useState<{
    dayName: string;
    timeStr: string;
    remainingStr: string;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    setFormatted(formatAiringTime(nextEpisodeAt));
    setScheduleStr(getAiringScheduleDisplay(nextEpisodeAt));
    const interval = setInterval(() => {
      setFormatted(formatAiringTime(nextEpisodeAt));
      setScheduleStr(getAiringScheduleDisplay(nextEpisodeAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [nextEpisodeAt]);

  if (!formatted || !nextEpisodeAt) {
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
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm shrink-0 font-medium">
        <span className="material-symbols-outlined text-[14px]">schedule</span>
        {scheduleStr || (formatted.isPast ? 'Вышла' : `через ${formatted.remainingStr}`)}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
        {formatted.isPast
          ? 'Серия уже вышла в эфир'
          : `Выходит в ${formatted.dayName.toLowerCase()} в ${formatted.timeStr} (по вашему времени)`}
      </span>
      {!formatted.isPast && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          До следующего эпизода осталось:{' '}
          <span className="font-bold text-tertiary">{formatted.remainingStr}</span>
        </p>
      )}
    </div>
  );
}
