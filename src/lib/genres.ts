// AniList English genre name -> Russian translation dictionary
export const ANILIST_GENRE_MAP: Record<string, string> = {
  Action: 'Экшен',
  Adventure: 'Приключения',
  Comedy: 'Комедия',
  Drama: 'Драма',
  Fantasy: 'Фэнтези',
  Horror: 'Ужасы',
  Mystery: 'Детектив',
  Romance: 'Романтика',
  'Sci-Fi': 'Фантастика',
  'Slice of Life': 'Повседневность',
  Sports: 'Спорт',
  Supernatural: 'Сверхъестественное',
  Psychological: 'Психология',
  'Mahou Shoujo': 'Махо-сёдзё',
  Mecha: 'Меха',
  Music: 'Музыка',
  Thriller: 'Триллер',
};

// Canonical genre priority order (Action, Supernatural, Fantasy first)
const PREFERRED_GENRE_ORDER = [
  'Экшен',
  'Сверхъестественное',
  'Приключения',
  'Фэнтези',
  'Комедия',
  'Детектив',
  'Фантастика',
  'Триллер',
  'Психология',
  'Драма',
  'Романтика',
  'Повседневность',
  'Спорт',
  'Махо-сёдзё',
  'Меха',
  'Музыка',
  'Ужасы',
];

/**
 * Translates an AniList or Russian genre name to standard Russian
 */
export function translateGenre(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  return ANILIST_GENRE_MAP[trimmed] || trimmed;
}

/**
 * Normalizes, filters out 18+/Ecchi, and sorts up to `max` genres
 */
export function sortAndFormatGenres(
  genreNames: (string | null | undefined)[],
  max = 3
): string[] {
  if (!genreNames || !Array.isArray(genreNames)) return [];

  const translated = genreNames
    .map(translateGenre)
    .filter((g) => Boolean(g) && g !== 'Hentai' && g !== 'Ecchi' && g !== 'Этти');

  const unique = Array.from(new Set(translated));

  unique.sort((a, b) => {
    const idxA = PREFERRED_GENRE_ORDER.indexOf(a);
    const idxB = PREFERRED_GENRE_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b, 'ru');
  });

  return unique.slice(0, max);
}
