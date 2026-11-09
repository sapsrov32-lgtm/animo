'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Anime } from '@/types';
import { RecommendCard } from './RecommendCard';
import { setAnimeWatchStatus } from '@/app/actions/tracker';

interface RecommendWorkspaceProps {
  allAnime: Anime[];
  userAnimeMap: Record<string, string>;
  isLoggedIn: boolean;
  initialMood?: string;
}

// Step 1: Moods
export const MOOD_OPTIONS = [
  {
    id: 'adrenaline',
    title: '⚡ Адреналин и драйв',
    desc: 'Бешеный экшен, напряжённые битвы и скорость',
    genreSlugs: ['action', 'sports', 'supernatural'],
  },
  {
    id: 'cozy',
    title: '🌙 Меланхолия и уют',
    desc: 'Ночные огни, тишина, задумчивость и тепло',
    genreSlugs: ['slice-of-life', 'drama'],
  },
  {
    id: 'mindgame',
    title: '🧠 Майндгейм',
    desc: 'Хитрые интриги, тайны, психологические дуэли',
    genreSlugs: ['psychological', 'thriller', 'mystery'],
  },
  {
    id: 'romance',
    title: '🌸 Тёплая романтика',
    desc: 'Искренние чувства, нежность и первая любовь',
    genreSlugs: ['romance'],
  },
  {
    id: 'relax',
    title: '🍃 Лёгкий отдых',
    desc: 'Комедия, непринуждённый сюжет и улыбка',
    genreSlugs: ['comedy', 'slice-of-life'],
  },
];

// Step 2: Time Available
export const TIME_OPTIONS = [
  {
    id: 'short_season',
    title: '📦 Короткий сезон',
    desc: '10–13 серий на выходные дни',
    match: (a: Anime) =>
      a.format !== 'Фильм' &&
      typeof a.episodes === 'number' &&
      a.episodes >= 10 &&
      a.episodes <= 13,
  },
  {
    id: 'movie',
    title: '🍿 Полнометражный фильм',
    desc: 'Около 2 часов цельной истории',
    match: (a: Anime) =>
      a.format === 'Фильм' || a.format === 'Movie' || a.format === 'MOVIE',
  },
  {
    id: 'saga',
    title: '🏰 Масштабная сага',
    desc: '24+ эпизодов с проработанным миром',
    match: (a: Anime) =>
      (typeof a.episodes === 'number' && a.episodes >= 24) ||
      (a.status === 'ongoing' && (!a.episodes || a.episodes >= 24)),
  },
  {
    id: 'one_ep',
    title: '☕ Мини-формат / спешл',
    desc: 'Короткометражка, OVA или ONA до 15 мин',
    match: (a: Anime) =>
      a.format === 'ONA' ||
      a.format === 'OVA' ||
      a.format === 'Спэшл' ||
      a.format === 'Спешл' ||
      a.format === 'ТВ Короткометражка' ||
      (typeof a.episodes === 'number' && a.episodes >= 1 && a.episodes <= 6),
  },
];

// Step 3: Setting
export const SETTING_OPTIONS = [
  {
    id: 'cyberpunk',
    title: 'Киберпанк и нео-нуар',
    desc: 'Синдикаты, ИИ, дождливый мегаполис',
    badgeName: 'Киберпанк',
    matches: (anime: Anime, slugs: string[], names: string[], text: string) => {
      return (
        slugs.includes('cyberpunk') ||
        slugs.includes('sci-fi') ||
        names.includes('киберпанк') ||
        names.includes('фантастика') ||
        text.includes('киберпанк') ||
        text.includes('cyberpunk') ||
        text.includes('дистопи') ||
        text.includes('dystopi')
      );
    },
  },
  {
    id: 'dark_fantasy',
    title: 'Тёмное фэнтези',
    desc: 'Мрачные клинки, древние проклятия',
    badgeName: 'Тёмное фэнтези',
    matches: (anime: Anime, slugs: string[], names: string[], text: string) => {
      const hasFantasy = slugs.includes('fantasy') || names.includes('фэнтези');
      const isDark =
        slugs.includes('horror') ||
        slugs.includes('supernatural') ||
        slugs.includes('thriller') ||
        names.includes('ужасы') ||
        names.includes('сверхъестественное') ||
        names.includes('триллер') ||
        text.includes('тёмное фэнтези') ||
        text.includes('dark fantasy') ||
        text.includes('демон');
      return (hasFantasy && isDark) || text.includes('тёмное фэнтези') || text.includes('dark fantasy');
    },
  },
  {
    id: 'slice',
    title: 'Срез жизни / Дружба',
    desc: 'Реализм, школа, взросление и юмор',
    badgeName: 'Срез жизни',
    matches: (anime: Anime, slugs: string[], names: string[], text: string) => {
      return (
        slugs.includes('slice-of-life') ||
        names.includes('повседневность') ||
        text.includes('повседневность') ||
        text.includes('slice of life')
      );
    },
  },
  {
    id: 'scifi',
    title: 'Научная фантастика / Таймтревел',
    desc: 'Петли времени, космос, парадоксы, наука',
    badgeName: 'Научная фантастика',
    matches: (anime: Anime, slugs: string[], names: string[], text: string) => {
      return (
        slugs.includes('sci-fi') ||
        names.includes('фантастика') ||
        text.includes('научная фантастика') ||
        text.includes('таймтревел') ||
        text.includes('time travel') ||
        text.includes('петл') ||
        text.includes('космос') ||
        text.includes('space')
      );
    },
  },
];

function normalizeMoodId(mood?: string | null): string {
  if (!mood) return 'mindgame';
  const m = mood.toLowerCase().trim();
  if (m === 'adrenaline' || m === 'adrenalin') return 'adrenaline';
  if (m === 'cozy' || m === 'melancholy') return 'cozy';
  if (m === 'mindgame' || m === 'mindgames') return 'mindgame';
  if (m === 'romance') return 'romance';
  if (m === 'relax') return 'relax';
  return 'mindgame';
}

export function RecommendWorkspace({
  allAnime,
  userAnimeMap,
  isLoggedIn,
  initialMood,
}: RecommendWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected criteria state (initialized from URL ?mood=; time and setting are NOT pre-selected)
  const [selectedMood, setSelectedMood] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlMood = sp.get('mood');
      if (urlMood) return normalizeMoodId(urlMood);
    }
    return normalizeMoodId(initialMood);
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  const [addingAll, setAddingAll] = useState(false);
  const [addAllFeedback, setAddAllFeedback] = useState(false);

  // Sync state whenever URL query changes (handles client navigation, back/forward)
  useEffect(() => {
    const urlMood = searchParams?.get('mood');
    if (urlMood) {
      setSelectedMood(normalizeMoodId(urlMood));
    }
  }, [searchParams]);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      sp.set('mood', moodId);
      router.replace(`/recommend?${sp.toString()}`, { scroll: false });
    }
  };

  // Real Filtering Logic with Graceful Fallback
  const { recommendations, isExactMatches } = useMemo(() => {
    const currentMood = MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[0];
    const currentTime = selectedTime ? TIME_OPTIONS.find((t) => t.id === selectedTime) : null;
    const currentSetting = selectedSetting ? SETTING_OPTIONS.find((s) => s.id === selectedSetting) : null;

    const getAnimeGenreSlugs = (anime: Anime): string[] => {
      const fromGenres = anime.genres?.map((g) => g.slug?.toLowerCase()).filter(Boolean) || [];
      const fromAg =
        anime.anime_genres?.map((ag: any) => ag.genres?.slug?.toLowerCase()).filter(Boolean) || [];
      return Array.from(new Set([...fromGenres, ...fromAg]));
    };

    const getAnimeGenreNames = (anime: Anime): string[] => {
      const fromGenres = anime.genres?.map((g) => g.name_ru).filter(Boolean) || [];
      const fromAg =
        anime.anime_genres?.map((ag: any) => ag.genres?.name_ru).filter(Boolean) || [];
      return Array.from(new Set([...fromGenres, ...fromAg]));
    };

    // Filter candidate pool matching Mood and (if chosen) Time
    const pool = allAnime.filter((anime) => {
      if (!anime.poster_url || anime.poster_url.trim() === '') return false;
      if (anime.is_adult) return false;

      // Time filter (only if selected)
      if (currentTime && !currentTime.match(anime)) return false;

      // Mood filter
      const slugs = getAnimeGenreSlugs(anime);
      const matchesMood = currentMood.genreSlugs.some((s) => slugs.includes(s));
      if (!matchesMood) return false;

      // Cozy filter: exclude violent action or gore horror so cozy stays tranquil and warm
      if (currentMood.id === 'cozy' && (slugs.includes('action') || slugs.includes('horror'))) {
        return false;
      }

      return true;
    });

    const deduplicateFranchise = (list: Anime[]): Anime[] => {
      const seen = new Set<string>();
      const result: Anime[] = [];
      for (const a of list) {
        const title = (a.title_en || a.title_ru || '').toLowerCase();
        const baseKey = title
          .replace(/(?:season|part|2nd|3rd|4th|final|коллаборация|сезон|фильм|\b\d+\b).*/gi, '')
          .trim();
        if (!seen.has(baseKey)) {
          seen.add(baseKey);
          result.push(a);
        }
      }
      return result;
    };

    // Setting filter (only if setting is selected)
    let exactCandidates: Anime[] = [];
    if (currentSetting) {
      exactCandidates = pool.filter((anime) => {
        const slugs = getAnimeGenreSlugs(anime);
        const names = getAnimeGenreNames(anime).map((n) => n.toLowerCase());
        const text = `${anime.title_ru || ''} ${anime.title_en || ''} ${anime.description || ''}`.toLowerCase();
        return currentSetting.matches(anime, slugs, names, text);
      });
    } else {
      exactCandidates = pool;
    }

    exactCandidates.sort((a, b) => {
      const scoreA = (a.score || 7.0) * 10 + (a.popularity || 0) / 10000;
      const scoreB = (b.score || 7.0) * 10 + (b.popularity || 0) / 10000;
      return scoreB - scoreA;
    });

    const exactMatches = deduplicateFranchise(exactCandidates);

    let finalAnimeList: Anime[] = [];
    let exact = true;

    if (exactMatches.length >= 6) {
      finalAnimeList = exactMatches.slice(0, 6);
      exact = true;
    } else {
      // If less than 6 exact results, relax the setting criterion and show closest matches
      exact = false;
      const exactIds = new Set(exactMatches.map((a) => a.id));

      const relaxedCandidates = pool.filter((a) => !exactIds.has(a.id));
      relaxedCandidates.sort((a, b) => {
        const scoreA = (a.score || 7.0) * 10 + (a.popularity || 0) / 10000;
        const scoreB = (b.score || 7.0) * 10 + (b.popularity || 0) / 10000;
        return scoreB - scoreA;
      });

      const relaxedMatches = deduplicateFranchise(relaxedCandidates);
      finalAnimeList = [...exactMatches, ...relaxedMatches.slice(0, 6 - exactMatches.length)];

      // If still less than 6, expand to candidate pool matching mood
      if (finalAnimeList.length < 6) {
        const currentIds = new Set(finalAnimeList.map((a) => a.id));
        const moodCandidates = allAnime.filter((a) => {
          if (currentIds.has(a.id) || !a.poster_url || a.is_adult) return false;
          const slugs = getAnimeGenreSlugs(a);
          return currentMood.genreSlugs.some((s) => slugs.includes(s));
        });
        moodCandidates.sort((a, b) => (b.score || 7.0) - (a.score || 7.0));
        const extraMood = deduplicateFranchise(moodCandidates);
        finalAnimeList = [...finalAnimeList, ...extraMood.slice(0, 6 - finalAnimeList.length)];
      }
    }

    // Build real matched criteria description: only include what truly matched!
    const recs = finalAnimeList.map((anime) => {
      const slugs = getAnimeGenreSlugs(anime);
      const names = getAnimeGenreNames(anime);
      const text = `${anime.title_ru || ''} ${anime.title_en || ''} ${anime.description || ''}`.toLowerCase();

      const matchedParts: string[] = [];

      // 1. Mood genres that actually matched
      const matchedMoodGenres = names.filter((name) => {
        const tr = name.toLowerCase();
        return currentMood.genreSlugs.some((s) => {
          if (s === 'action') return tr.includes('экшен') || tr.includes('боевик');
          if (s === 'sports') return tr.includes('спорт');
          if (s === 'supernatural') return tr.includes('сверхъестествен') || tr.includes('мистик');
          if (s === 'slice-of-life') return tr.includes('повседневн');
          if (s === 'drama') return tr.includes('драм');
          if (s === 'psychological') return tr.includes('психолог');
          if (s === 'thriller') return tr.includes('триллер');
          if (s === 'mystery') return tr.includes('детектив') || tr.includes('тайн');
          if (s === 'romance') return tr.includes('романтик');
          if (s === 'comedy') return tr.includes('комед');
          return false;
        });
      });

      if (matchedMoodGenres.length > 0) {
        matchedParts.push(matchedMoodGenres.slice(0, 2).join(', '));
      } else if (names[0]) {
        matchedParts.push(names[0]);
      }

      // 2. Setting match (ONLY if setting was selected AND truly matched)
      let matchesSetting = true;
      if (currentSetting) {
        matchesSetting = currentSetting.matches(anime, slugs, names.map((n) => n.toLowerCase()), text);
        if (matchesSetting) {
          matchedParts.push(currentSetting.badgeName);
        }
      }

      // 3. Time match (ONLY if time was selected AND truly matched)
      let matchesTime = true;
      if (currentTime) {
        matchesTime = currentTime.match(anime);
        if (matchesTime) {
          const timeLabel =
            anime.format === 'Фильм'
              ? 'Фильм'
              : anime.episodes
              ? `${anime.episodes} серий`
              : anime.status === 'ongoing'
              ? 'Идёт показ'
              : anime.format || 'Серии';
          matchedParts.push(timeLabel);
        }
      }

      // 4. Rating
      if (anime.score) {
        matchedParts.push(`рейтинг ${anime.score.toFixed(1)}`);
      }

      // Exact match means it matches all selected criteria
      const isExact = matchesSetting && matchesTime;

      return {
        anime,
        matchedCriteriaText: matchedParts.join(', '),
        isExact,
      };
    });

    return {
      recommendations: recs,
      isExactMatches: exact,
    };
  }, [allAnime, selectedMood, selectedTime, selectedSetting]);

  // Real statistics calculated directly from shown recommendations
  const totalEpisodesCount = recommendations.reduce(
    (acc, curr) => acc + (curr.anime.episodes || (curr.anime.format === 'Фильм' ? 1 : 12)),
    0
  );
  const averageScore =
    recommendations.length > 0
      ? recommendations.reduce((acc, curr) => acc + (curr.anime.score || 7.5), 0) /
        recommendations.length
      : 8.0;

  const selectedCount = 1 + (selectedTime ? 1 : 0) + (selectedSetting ? 1 : 0);
  const progressPercent = selectedCount === 1 ? 33 : selectedCount === 2 ? 67 : 100;

  const handleRestart = () => {
    setSelectedTime(null);
    setSelectedSetting(null);
  };

  const handleRandomPick = () => {
    const randomMood = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)].id;
    handleMoodSelect(randomMood);
    setSelectedTime(null);
    setSelectedSetting(null);

    const resultsEl = document.getElementById('recommendation-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddAll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setAddingAll(true);
    try {
      for (const item of recommendations) {
        await setAnimeWatchStatus(item.anime.id, 'plan');
      }
      setAddAllFeedback(true);
      setTimeout(() => setAddAllFeedback(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="relative w-full max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
        {/* Ambient Glows */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary-container/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-[420px] h-[320px] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Section Header */}
        <section className="relative flex flex-col md:flex-row md:items-end justify-between gap-space-lg pt-space-sm">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm tracking-wide border border-primary/20">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                ИНТЕЛЛЕКТУАЛЬНЫЙ КОМПАС
              </span>
              <span className="font-body-sm text-body-sm text-outline">Без спойлеров и клише</span>
            </div>

            <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-on-surface font-bold tracking-tight">
              Что посмотреть? Персональный компас
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Выберите настроение, доступный формат и сеттинг — алгоритм сопоставит каталог с вашими предпочтениями и предложит подходящие тайтлы.
            </p>
          </div>

          {/* Radial Indicator Box (reflects real matching state) */}
          <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center gap-4 shadow-xl border border-outline-variant/20 shrink-0">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-surface-container-high text-secondary shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-highest"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-secondary transition-all duration-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-badge-score text-badge-score text-on-surface">
                {selectedCount}/3
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {selectedCount === 3
                  ? isExactMatches
                    ? 'Статус подбора 3/3 (100%)'
                    : 'Статус подбора 3/3 (близкие)'
                  : `Статус подбора ${selectedCount}/3`}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {selectedCount === 1
                  ? 'Выбран 1 из 3 параметров (Настроение)'
                  : selectedCount === 2
                  ? 'Выбрано 2 из 3 параметров'
                  : isExactMatches
                  ? 'Все параметры учтены • Точные совпадения'
                  : 'Мало точных совпадений, показаны близкие'}
              </span>
            </div>
          </div>
        </section>

        {/* Steps Ribbon Strip */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm font-bold">
                1
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Шаг 1
                </span>
                <span className="font-title-card text-title-card text-on-surface truncate">
                  Настроение
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm font-bold">
                2
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Шаг 2
                </span>
                <span className="font-title-card text-title-card text-on-surface truncate">Время</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm font-bold">
                3
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Шаг 3
                </span>
                <span className="font-title-card text-title-card text-on-surface truncate">
                  Сеттинг
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-container/20 shadow-md border border-primary/40">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                ✓
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                  Финал
                </span>
                <span className="font-title-card text-title-card text-primary font-bold truncate">
                  Результат
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Interactive Configurator / Steps Panel */}
        <div className="bg-surface-container-low rounded-2xl p-space-md md:p-space-lg flex flex-col gap-space-lg shadow-xl border border-outline-variant/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container-highest/60">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">tune</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Выбранные критерии рекомендаций
              </h2>
            </div>
            <div className="flex items-center gap-2 text-outline font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px]">touch_app</span>
              <span>Нажмите на карточку, чтобы переключить параметр</span>
            </div>
          </div>

          {/* Step 1: Mood */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                1. Ваше текущее состояние и настроение
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Активно:{' '}
                <strong className="text-on-surface">
                  {MOOD_OPTIONS.find((m) => m.id === selectedMood)?.title}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {MOOD_OPTIONS.map((mood) => {
                const isActive = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1.5 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-on-surface group-hover:text-primary'
                      }`}
                    >
                      <span>{mood.title}</span>
                      {isActive && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check_circle
                        </span>
                      )}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{mood.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Time Available */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                2. Доступное время на погружение
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Активно:{' '}
                <strong className="text-on-surface">
                  {selectedTime
                    ? TIME_OPTIONS.find((t) => t.id === selectedTime)?.title
                    : 'Все форматы (не выбрано)'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TIME_OPTIONS.map((time) => {
                const isActive = selectedTime === time.id;
                return (
                  <button
                    key={time.id}
                    type="button"
                    onClick={() => setSelectedTime(selectedTime === time.id ? null : time.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-on-surface group-hover:text-primary'
                      }`}
                    >
                      <span>{time.title}</span>
                      {isActive && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check_circle
                        </span>
                      )}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{time.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Setting */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                3. Желаемый сеттинг и атмосфера
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Активно:{' '}
                <strong className="text-on-surface">
                  {selectedSetting
                    ? SETTING_OPTIONS.find((s) => s.id === selectedSetting)?.title
                    : 'Все сеттинги (не выбрано)'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SETTING_OPTIONS.map((setting) => {
                const isActive = selectedSetting === setting.id;
                return (
                  <button
                    key={setting.id}
                    type="button"
                    onClick={() => setSelectedSetting(selectedSetting === setting.id ? null : setting.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-on-surface group-hover:text-primary'
                      }`}
                    >
                      <span>{setting.title}</span>
                      {isActive && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check_circle
                        </span>
                      )}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{setting.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommendations Result Section */}
        <section className="flex flex-col gap-space-lg pt-space-sm" id="recommendation-results">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                  Персональная выборка
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                Результаты подбора для вас
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {recommendations.length} тайтлов, соответствующих вашим критериям настроения и формата
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                type="button"
                onClick={handleRandomPick}
                className="px-4 py-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md flex items-center gap-2 transition-all border border-outline-variant/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-tertiary">casino</span>
                <span>Мне повезёт!</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md flex items-center gap-2 transition-all border border-outline-variant/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>Сбросить</span>
              </button>

              <button
                type="button"
                onClick={handleAddAll}
                disabled={addingAll}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-label-md text-label-md font-semibold flex items-center gap-2 shadow-[0_4px_16px_-2px_rgba(124,58,237,0.35)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {addAllFeedback ? 'done_all' : 'playlist_add_check'}
                </span>
                <span>{addAllFeedback ? 'Все добавлены в планы!' : 'Добавить все в «Хочу»'}</span>
              </button>
            </div>
          </div>

          {/* Graceful Fallback Warning Banner if results are relaxed */}
          {!isExactMatches && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-body-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-amber-400 shrink-0">
                info
              </span>
              <div>
                <span className="font-semibold block text-amber-300">
                  Мало точных совпадений, показаны близкие
                </span>
                <span className="text-amber-200/80 text-xs">
                  Точных тайтлов по всем 3 критериям оказалось меньше 6. Мы сохранили ваше настроение и хронометраж, расширив сеттинг.
                </span>
              </div>
            </div>
          )}

          {/* Recommendation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {recommendations.map((rec) => (
              <RecommendCard
                key={rec.anime.id}
                anime={rec.anime}
                matchedCriteriaText={rec.matchedCriteriaText}
                isExactMatch={rec.isExact}
                userStatus={userAnimeMap[rec.anime.id]}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </section>

        {/* Detailed Compatibility Breakdown & Insight Block (Calculated from shown anime) */}
        <section className="bg-surface-container-low rounded-2xl p-space-md md:p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-lg border border-outline-variant/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[28px]">insights</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Как сформирован этот персональный лист?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
                Система сопоставила выбранные критерии с каталогом «Анимо», отобрав тайтлы с реальным совпадением жанров настроения, хронометража серий и сеттинга.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-center">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-primary">0</span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Спойлеров
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-secondary">
                {totalEpisodesCount}
              </span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Серий суммарно
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-tertiary">
                {averageScore.toFixed(1)}
              </span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                Средний балл
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
