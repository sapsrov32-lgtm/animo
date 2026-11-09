export function sanitizeRussianTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  const trimmed = title.trim();
  if (!trimmed) return null;

  // 1. Detect non-Russian Cyrillic characters (Ukrainian, Belarusian, Serbian, Macedonian, etc.)
  // e.g. і, ї, є, ґ, ў, љ, њ, џ, ћ, ђ
  if (/[ієїґўљњџћђ]/i.test(trimmed)) {
    return null;
  }

  // 2. Detect Bulgarian characteristic words:
  // e.g. "Дневниците на билкарката", "Гимназията на мъртвите", "Екот на терор", "кръстоносци"
  if (/\b(дневниците|билкарката|кръстоносци|мъртвите|екот|приключенията|сезона|невероятните)\b/i.test(trimmed)) {
    return null;
  }

  // Bulgarian definite article phrases: "...та на...", "...то на...", "...те на...", "...ят на..."
  if (/\b\w+(?:та|то|те|ят|ът)\s+на\s+\w+/i.test(trimmed)) {
    return null;
  }

  // Bulgarian characteristic prepositions
  if (/\b(?:във|със)\b/i.test(trimmed)) {
    return null;
  }

  // 3. Detect Ukrainian words
  if (/\b(трилогія|початку|історій|року|серія|фільм|дахів)\b/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function getDisplayTitle(anime: {
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
}): string {
  const validRu = sanitizeRussianTitle(anime.title_ru);
  return validRu || anime.title_en || anime.title_jp || 'Без названия';
}

export function getSecondaryTitle(anime: {
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
}): string | null {
  const validRu = sanitizeRussianTitle(anime.title_ru);
  if (validRu) {
    return anime.title_en || anime.title_jp || null;
  }
  if (anime.title_en) {
    return anime.title_jp || null;
  }
  return null;
}

export function isRussianText(text: string | null | undefined): boolean {
  if (!text) return false;
  const cyrillicMatches = text.match(/[а-яА-ЯёЁ]/g);
  return Boolean(cyrillicMatches && cyrillicMatches.length >= 10);
}

export function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return '';
  return desc
    // 1. Remove special episodes / specials list
    .replace(/(?:(?:\*|\n)?\s*(?:This includes the following special episodes|Included specials|Special episodes|Специальные эпизоды|Спешлы):[\s\S]*)/gi, '')
    // 2. Remove (Source: ...) or [Source: ...] or (Written by: ...) or (Примечание: ...)
    .replace(/\s*[\(\[](?:Source|Written by|Примечание|Источник):?[^\)\]]*[\)\]]/gi, '')
    // 3. Remove standalone Source: or Источник: or Note: lines
    .replace(/\s*(?:Source|Источник):.*$/gim, '')
    .replace(/\s*(?:Note|Примечание):.*$/gim, '')
    .replace(/\s*\*Note:[^\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatAiringTime(isoDate: string | null | undefined): {
  dayName: string;
  timeStr: string;
  remainingStr: string;
  isPast: boolean;
  days: number;
  isHiatus: boolean;
  hiatusText: string;
} {
  if (!isoDate) {
    return {
      dayName: '',
      timeStr: '',
      remainingStr: 'Дата не объявлена',
      isPast: true,
      days: 0,
      isHiatus: false,
      hiatusText: '',
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
      days: 0,
      isHiatus: false,
      hiatusText: '',
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

  // Format date in Russian: e.g. "3 января 2027"
  const formattedDate = targetDate
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      ...(targetDate.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    })
    .replace(/\s*г\.?$/, '');

  const isHiatus = days > 14;
  const hiatusText = `Перерыв в показе, следующая серия ${formattedDate}`;

  return {
    dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
    timeStr,
    remainingStr,
    isPast: false,
    days,
    isHiatus,
    hiatusText,
  };
}

export function getAiringScheduleDisplay(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Дата не объявлена';
  const target = new Date(isoDate);
  if (isNaN(target.getTime())) return 'Дата не объявлена';

  const now = new Date();
  const timeStr = target.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear();

  if (isToday) {
    return `Сегодня ${timeStr}`;
  }
  if (isTomorrow) {
    return `Завтра ${timeStr}`;
  }

  const weekday = target.toLocaleDateString('ru-RU', { weekday: 'short' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '');
  return `${capitalizedWeekday}, ${timeStr}`;
}

export function getEpisodeStatusBadge(
  dateInput: string | number | null | undefined,
  mode: 'calendar' | 'home' = 'calendar'
): {
  text: string;
  isPast: boolean;
  isToday: boolean;
} {
  if (!dateInput) {
    return { text: 'Дата не объявлена', isPast: true, isToday: false };
  }

  const airDate = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
  if (isNaN(airDate.getTime())) {
    return { text: 'Дата не объявлена', isPast: true, isToday: false };
  }

  const now = new Date();
  const diffMs = airDate.getTime() - now.getTime();

  // Local start/end of day boundaries in user's browser timezone
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const isToday = airDate >= todayStart && airDate <= todayEnd;
  const isYesterday = airDate >= yesterdayStart && airDate < todayStart;
  const isTomorrow = airDate >= tomorrowStart && airDate <= tomorrowEnd;

  const timeStr = airDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // PAST:
  if (diffMs < 0) {
    if (isToday) {
      const hoursAgo = Math.floor(Math.abs(diffMs) / (3600 * 1000));
      return { text: hoursAgo < 1 ? 'Вышла недавно' : `Вышла ${hoursAgo} ч. назад`, isPast: true, isToday: true };
    }
    if (isYesterday) {
      return { text: 'Вышла вчера', isPast: true, isToday: false };
    }
    const daysAgo = Math.floor((todayStart.getTime() - airDate.getTime()) / (86400 * 1000)) + 1;
    let daysAgoStr = `${daysAgo} дней назад`;
    const lastDigit = daysAgo % 10;
    const lastTwo = daysAgo % 100;
    if (lastTwo >= 11 && lastTwo <= 19) {
      daysAgoStr = `${daysAgo} дней назад`;
    } else if (lastDigit === 1) {
      daysAgoStr = `${daysAgo} день назад`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      daysAgoStr = `${daysAgo} дня назад`;
    }
    return { text: `Вышла ${daysAgoStr}`, isPast: true, isToday: false };
  }

  // FUTURE:
  const daysInFuture = Math.floor(diffMs / (86400 * 1000));
  if (daysInFuture > 14) {
    return { text: 'Перерыв в показе', isPast: false, isToday: false };
  }

  if (isToday) {
    if (mode === 'home') {
      return { text: `Сегодня ${timeStr}`, isPast: false, isToday: true };
    }
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    let remStr = '';
    if (hours > 0 && minutes > 0) {
      remStr = `${hours} ч ${minutes} мин`;
    } else if (hours > 0) {
      remStr = `${hours} ч`;
    } else {
      remStr = `${Math.max(1, minutes)} мин`;
    }
    return { text: `Через ${remStr}`, isPast: false, isToday: true };
  }

  if (isTomorrow) {
    return { text: `Завтра ${timeStr}`, isPast: false, isToday: false };
  }

  const weekday = airDate.toLocaleDateString('ru-RU', { weekday: 'short' });
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '');
  return { text: `${capWeekday} ${timeStr}`, isPast: false, isToday: false };
}
