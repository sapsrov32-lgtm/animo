'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anime } from '@/types';
import { RecommendCard } from './RecommendCard';
import { setAnimeWatchStatus } from '@/app/actions/tracker';

interface RecommendWorkspaceProps {
  allAnime: Anime[];
  userAnimeMap: Record<string, string>;
  isLoggedIn: boolean;
}

// Step 1: Moods
const MOOD_OPTIONS = [
  {
    id: 'mindgame',
    title: '🧠 Майндгейм и майндфак',
    desc: 'Хитрые интриги, тайны и шок',
    genreSlugs: ['psychological', 'mystery', 'thriller'],
  },
  {
    id: 'adrenalin',
    title: '⚡ Адреналин и драйв',
    desc: 'Бешеный экшен, напряжённые битвы',
    genreSlugs: ['action', 'sports', 'supernatural'],
  },
  {
    id: 'melancholy',
    title: '🌙 Меланхолия и уют',
    desc: 'Ночные огни, тишина, задумчивость',
    genreSlugs: ['slice-of-life', 'drama', 'music'],
  },
  {
    id: 'romance',
    title: '🌸 Тёплая романтика',
    desc: 'Искренние чувства, нежность и юмор',
    genreSlugs: ['romance', 'comedy'],
  },
  {
    id: 'adventure',
    title: '⚔️ Эпическое приключение',
    desc: 'Исследование новых миров и магия',
    genreSlugs: ['adventure', 'fantasy'],
  },
];

// Step 2: Time Available
const TIME_OPTIONS = [
  {
    id: 'short_season',
    title: '📦 Короткий сезон',
    desc: '10–13 серий на выходные дни',
    match: (a: Anime) => (!a.format || a.format === 'ТВ Сериал') && (a.episodes ? a.episodes <= 14 : true),
  },
  {
    id: 'movie',
    title: '🍿 Полнометражный фильм',
    desc: 'Около 2 часов цельной истории',
    match: (a: Anime) => a.format === 'Фильм',
  },
  {
    id: 'saga',
    title: '🏰 Масштабная сага',
    desc: '24+ эпизодов с проработанным миром',
    match: (a: Anime) => (a.episodes ? a.episodes >= 20 : a.status === 'ongoing'),
  },
  {
    id: 'one_ep',
    title: '☕ Одна серия / мини-формат',
    desc: '20–30 минут прямо сейчас перед сном',
    match: (a: Anime) => a.format === 'ONA' || a.format === 'Спэшл' || (a.episodes ? a.episodes <= 12 : false),
  },
];

// Step 3: Setting
const SETTING_OPTIONS = [
  {
    id: 'cyberpunk',
    title: 'Киберпанк и нео-нуар',
    desc: 'Синдикаты, ИИ, дождливый мегаполис',
    genreSlugs: ['sci-fi', 'thriller', 'mystery'],
  },
  {
    id: 'dark_fantasy',
    title: 'Тёмное фэнтези',
    desc: 'Мрачные клинки, древние проклятия',
    genreSlugs: ['fantasy', 'horror', 'action'],
  },
  {
    id: 'slice',
    title: 'Срез жизни / Дружба',
    desc: 'Реализм, школа, взросление и юмор',
    genreSlugs: ['slice-of-life', 'comedy'],
  },
  {
    id: 'scifi',
    title: 'Научная фантастика / Таймтревел',
    desc: 'Петли времени, парадоксы, наука',
    genreSlugs: ['sci-fi', 'mystery'],
  },
];

export function RecommendWorkspace({
  allAnime,
  userAnimeMap,
  isLoggedIn,
}: RecommendWorkspaceProps) {
  const router = useRouter();

  // Selected state (defaults match design preview)
  const [selectedMood, setSelectedMood] = useState<string>('mindgame');
  const [selectedTime, setSelectedTime] = useState<string>('short_season');
  const [selectedSetting, setSelectedSetting] = useState<string>('cyberpunk');

  const [addingAll, setAddingAll] = useState(false);
  const [addAllFeedback, setAddAllFeedback] = useState(false);

  // 1. Calculate matching recommendations
  const recommendations = useMemo(() => {
    const currentMood = MOOD_OPTIONS.find((m) => m.id === selectedMood);
    const currentTime = TIME_OPTIONS.find((t) => t.id === selectedTime);
    const currentSetting = SETTING_OPTIONS.find((s) => s.id === selectedSetting);

    const scored = allAnime.map((anime) => {
      let scorePoints = (anime.score || 7.5) * 5; // Base 35-50 pts

      const animeGenreSlugs =
        anime.genres?.map((g) => g.slug) ||
        anime.anime_genres?.map((ag: any) => ag.genres?.slug).filter(Boolean) ||
        [];

      // Time match bonus
      if (currentTime && currentTime.match(anime)) {
        scorePoints += 30;
      }

      // Mood match bonus
      if (currentMood) {
        const moodMatches = currentMood.genreSlugs.filter((slug) =>
          animeGenreSlugs.includes(slug)
        ).length;
        scorePoints += moodMatches * 15;
      }

      // Setting match bonus
      if (currentSetting) {
        const settingMatches = currentSetting.genreSlugs.filter((slug) =>
          animeGenreSlugs.includes(slug)
        ).length;
        scorePoints += settingMatches * 15;
      }

      // Generate context-aware reason
      let reason = 'Высокий рейтинг сообщества и гармоничное попадание в выбранные параметры.';
      if (selectedTime === 'movie' && anime.format === 'Фильм') {
        reason = 'Идеальный полнометражный шедевр на вечер без необходимости растягивать просмотр на недели.';
      } else if (selectedMood === 'mindgame') {
        reason = 'Непревзойдённый психологический триллер с высокими ставками и шокирующими сюжетными твистами.';
      } else if (selectedMood === 'adrenalin') {
        reason = `Захватывающий драйв и эталонная анимация боевых сцен от студии ${anime.studio || 'ведущих мастеров'}.`;
      } else if (selectedMood === 'melancholy') {
        reason = 'Уютная, медитативная атмосфера для вечернего спокойного погружения.';
      } else if (selectedMood === 'romance') {
        reason = 'Трогательная и глубокая романтическая линия, получившая признание сообщества.';
      } else if (selectedSetting === 'cyberpunk') {
        reason = 'Атмосферный киберпанк с высокими технологиями и глубокой интригой.';
      }

      return {
        anime,
        scorePoints,
        reason,
      };
    });

    // Sort by computed points descending and take top 6
    scored.sort((a, b) => b.scorePoints - a.scorePoints);
    const top = scored.slice(0, 6);

    // Normalize match percentage
    return top.map((item, idx) => ({
      ...item,
      matchPercent: Math.max(92, Math.min(99, 99 - idx)),
    }));
  }, [allAnime, selectedMood, selectedTime, selectedSetting]);

  // Insights calculations
  const totalEpisodesCount = recommendations.reduce(
    (acc, curr) => acc + (curr.anime.episodes || 1),
    0
  );
  const averageScore =
    recommendations.length > 0
      ? recommendations.reduce((acc, curr) => acc + (curr.anime.score || 8.0), 0) /
        recommendations.length
      : 8.8;

  // Handlers
  const handleRestart = () => {
    setSelectedMood('mindgame');
    setSelectedTime('short_season');
    setSelectedSetting('cyberpunk');
  };

  const handleRandomPick = () => {
    const randomMood = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)].id;
    const randomTime = TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)].id;
    const randomSetting = SETTING_OPTIONS[Math.floor(Math.random() * SETTING_OPTIONS.length)].id;

    setSelectedMood(randomMood);
    setSelectedTime(randomTime);
    setSelectedSetting(randomSetting);

    // Smooth scroll down to results
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
                НЕЙРОПОДБОР 3.0
              </span>
              <span className="font-body-sm text-body-sm text-outline">Без спойлеров и клише</span>
            </div>

            <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-on-surface font-bold tracking-tight">
              Интеллектуальный компас аниме
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Ответьте на 3 простых вопроса, и алгоритм подберёт идеальный тайтл под ваше состояние и доступное время без спойлеров.
            </p>
          </div>

          {/* Radial Indicator Box */}
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
                  strokeDasharray="100, 100"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-badge-score text-badge-score text-on-surface">100%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold">Статус подбора</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Все параметры учтены • Готово</span>
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
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Шаг 1</span>
                <span className="font-title-card text-title-card text-on-surface truncate">Настроение</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm font-bold">
                2
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Шаг 2</span>
                <span className="font-title-card text-title-card text-on-surface truncate">Время</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm font-bold">
                3
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Шаг 3</span>
                <span className="font-title-card text-title-card text-on-surface truncate">Сеттинг</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-container/20 shadow-md border border-primary/40">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                ✓
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Финал</span>
                <span className="font-title-card text-title-card text-primary font-bold truncate">Результат</span>
              </div>
            </div>
          </div>

          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full w-full transition-all duration-500" />
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
                    onClick={() => setSelectedMood(mood.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1.5 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'
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
                  {TIME_OPTIONS.find((t) => t.id === selectedTime)?.title}
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
                    onClick={() => setSelectedTime(time.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'
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
                  {SETTING_OPTIONS.find((s) => s.id === selectedSetting)?.title}
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
                    onClick={() => setSelectedSetting(setting.id)}
                    className={`text-left p-3.5 rounded-xl transition-all flex flex-col gap-1 group cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container-highest shadow-[0_0_20px_-2px_rgba(208,188,255,0.35)] border-primary/50'
                        : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <span
                      className={`font-title-card text-title-card flex items-center justify-between transition-colors ${
                        isActive ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'
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
                {recommendations.length} тайтлов, показавших наивысший коэффициент совпадения по вашим ответам
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

          {/* Recommendation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {recommendations.map((rec) => (
              <RecommendCard
                key={rec.anime.id}
                anime={rec.anime}
                matchPercent={rec.matchPercent}
                reason={rec.reason}
                userStatus={userAnimeMap[rec.anime.id]}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </section>

        {/* Detailed Compatibility Breakdown & Insight Block */}
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
                Система сопоставила выбранные критерии со срезом каталога «Анимо», автоматически рассчитав баланс темпа повествования, хронометража и рейтинга зрителей.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-center">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-primary">0</span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Спойлеров</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-secondary">{totalEpisodesCount}</span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Серий суммарно</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest" />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-tertiary">
                {averageScore.toFixed(1)}
              </span>
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Средний балл</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
