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

export function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return 'Описание этого тайтла ещё дополняется редакторами каталога.';
  return desc
    .replace(/\s*\((?:Source|written by):[^)]*\)/gi, '')
    .replace(/\s*\[(?:Written by|Source):[^\]]*\]/gi, '')
    .trim();
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
      remainingStr: 'Дата не объявлена',
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
