export function getDisplayTitle(anime: {
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
}): string {
  return anime.title_ru || anime.title_en || anime.title_jp || 'Без названия';
}

export function getSecondaryTitle(anime: {
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
}): string | null {
  if (anime.title_ru) {
    return anime.title_en || anime.title_jp || null;
  }
  if (anime.title_en) {
    return anime.title_jp || null;
  }
  return null;
}

export function formatAiringTime(isoDate: string | null | undefined): {
  dayName: string;
  timeStr: string;
  remainingStr: string;
  isPast: boolean;
} {
  if (!isoDate) {
    return {
      dayName: '',
      timeStr: '',
      remainingStr: '',
      isPast: true,
    };
  }

  const targetDate = new Date(isoDate);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      dayName: targetDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
      timeStr: targetDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      remainingStr: 'Серия уже вышла',
      isPast: true,
    };
  }

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  let remainingStr = '';
  if (days > 0) {
    remainingStr = `${days} дн. ${hours} ч. ${minutes} мин.`;
  } else if (hours > 0) {
    remainingStr = `${hours} ч. ${minutes} мин.`;
  } else {
    remainingStr = `${minutes} мин.`;
  }

  const dayName = targetDate.toLocaleDateString('ru-RU', { weekday: 'long' });
  const timeStr = targetDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return {
    dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
    timeStr,
    remainingStr,
    isPast: false,
  };
}
