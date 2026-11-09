/**
 * Список приблизительный, доступность сервисов меняется; проверять вручную.
 * 
 * Конфигурация приоритетов официальных стриминговых сервисов по странам.
 * Сопоставление названий сервисов происходит без учёта регистра и по ключевым словам.
 */

// Группа СНГ (RU, BY, KZ, KG, UZ, AM, AZ, GE, MD, TJ, TM, UA)
const CIS_COUNTRIES = [
  'RU', 'BY', 'KZ', 'KG', 'UZ', 'AM', 'AZ', 'GE', 'MD', 'TJ', 'TM', 'UA'
];
const CIS_PRIORITY = ['Okko', 'Wink', 'Kinopoisk', 'YouTube', 'Crunchyroll', 'Netflix'];

// Северная Америка (US, CA)
const NORTH_AMERICA_COUNTRIES = ['US', 'CA'];
const NORTH_AMERICA_PRIORITY = [
  'Crunchyroll',
  'Netflix',
  'Hulu',
  'Disney+',
  'Prime Video',
  'Hoopla',
  'YouTube',
];

// Европа (GB, DE, FR, ES, IT, PL и др.)
const EUROPEAN_COUNTRIES = [
  'GB', 'DE', 'FR', 'ES', 'IT', 'PL', 'NL', 'SE', 'NO', 'FI',
  'DK', 'CH', 'AT', 'BE', 'CZ', 'RO', 'BG', 'GR', 'PT', 'IE',
  'HU', 'SK', 'HR', 'RS', 'EE', 'LV', 'LT', 'IS'
];
const EUROPE_PRIORITY = ['Crunchyroll', 'Netflix', 'Disney+', 'Prime Video', 'YouTube'];

// Япония (JP)
const JAPAN_PRIORITY = ['Netflix', 'Prime Video', 'Disney+', 'YouTube'];

// По умолчанию (DEFAULT)
const DEFAULT_PRIORITY = ['Crunchyroll', 'Netflix', 'Prime Video', 'Disney+', 'YouTube'];

/**
 * Словарь: код страны (ISO 3166-1 alpha-2) -> массив названий сервисов в порядке приоритета
 */
export const PROVIDER_PRIORITY_BY_COUNTRY: Record<string, string[]> = {
  DEFAULT: DEFAULT_PRIORITY,
  JP: JAPAN_PRIORITY,
};

for (const code of CIS_COUNTRIES) {
  PROVIDER_PRIORITY_BY_COUNTRY[code] = CIS_PRIORITY;
}

for (const code of NORTH_AMERICA_COUNTRIES) {
  PROVIDER_PRIORITY_BY_COUNTRY[code] = NORTH_AMERICA_PRIORITY;
}

for (const code of EUROPEAN_COUNTRIES) {
  PROVIDER_PRIORITY_BY_COUNTRY[code] = EUROPE_PRIORITY;
}

/**
 * Ключевые слова для сопоставления названий сервисов без учёта регистра
 */
export const PROVIDER_ALIASES: Record<string, string[]> = {
  'Okko': ['okko'],
  'Wink': ['wink'],
  'Kinopoisk': ['kinopoisk', 'кинопоиск'],
  'Crunchyroll': ['crunchyroll'],
  'Netflix': ['netflix'],
  'Hulu': ['hulu'],
  'Disney+': ['disney+', 'disney plus', 'disney'],
  'Prime Video': ['prime video', 'amazon prime', 'amazon video', 'primevideo', 'amazon'],
  'Hoopla': ['hoopla'],
  'YouTube': ['youtube'],
};

/**
 * Сопоставляет переданное название сервиса с каноническим названием
 */
export function matchCanonicalProvider(site: string): string {
  if (!site) return '';
  const normalized = site.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(PROVIDER_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return canonical;
      }
    }
  }
  return site.trim();
}

/**
 * Возвращает приоритетный список сервисов для заданной страны
 */
export function getPriorityListForCountry(countryCode?: string | null): string[] {
  const code = (countryCode || '').trim().toUpperCase();
  if (code && PROVIDER_PRIORITY_BY_COUNTRY[code]) {
    return PROVIDER_PRIORITY_BY_COUNTRY[code];
  }
  return PROVIDER_PRIORITY_BY_COUNTRY['DEFAULT'];
}

/**
 * Сортировка официальных ссылок стримингов по приоритету страны с дедупликацией:
 * 1. Уникальность по сервису (один YouTube, а не два).
 * 2. Сервисы из приоритетного списка страны идут первыми согласно заданному порядку.
 * 3. Сервисы, не указанные в списке страны, идут ниже в исходном порядке.
 * 4. YouTube и бесплатные сервисы остаются внизу, если они не являются высоким приоритетом для страны.
 */
export function sortStreamingLinksByCountry<T extends { site: string }>(
  links: T[],
  countryCode?: string | null
): T[] {
  if (!links || links.length === 0) return [];

  // 1. Дедупликация: уникальность по названию сервиса
  const seenCanonical = new Set<string>();
  const deduplicated: T[] = [];
  for (const link of links) {
    const canonical = matchCanonicalProvider(link.site);
    const key = canonical.toLowerCase();
    if (!seenCanonical.has(key)) {
      seenCanonical.add(key);
      deduplicated.push(link);
    }
  }

  // 2. Список приоритетов для страны
  const priorityList = getPriorityListForCountry(countryCode);

  // 3. Вычисление ранга
  const getRank = (link: T, originalIndex: number): number => {
    const canonical = matchCanonicalProvider(link.site);
    const priorityIndex = priorityList.findIndex(
      (p) => p.toLowerCase() === canonical.toLowerCase()
    );

    if (priorityIndex !== -1) {
      return priorityIndex;
    }

    // Если сервис не указан в списке страны:
    // YouTube и бесплатные отправляются в самый низ, остальные — в исходном порядке ниже приоритетных
    const isFreeOrYouTube =
      canonical.toLowerCase() === 'youtube' ||
      /tubi|pluto|freevee|hoopla|bilibili/i.test(link.site);

    return isFreeOrYouTube ? 2000 + originalIndex : 1000 + originalIndex;
  };

  return [...deduplicated].sort((a, b) => {
    const origA = deduplicated.indexOf(a);
    const origB = deduplicated.indexOf(b);
    return getRank(a, origA) - getRank(b, origB);
  });
}
