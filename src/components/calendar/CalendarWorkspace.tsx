'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Anime } from '@/types';
import { CalendarCard } from './CalendarCard';

interface CalendarWorkspaceProps {
  animeList: Anime[];
  userAnimeMap: Record<string, { status: string; progress: number }>;
  isLoggedIn: boolean;
}

const WEEKDAYS = [
  { key: 'пн', label: 'Пн', full: 'Понедельник' },
  { key: 'вт', label: 'Вт', full: 'Вторник' },
  { key: 'ср', label: 'Ср', full: 'Среда' },
  { key: 'чт', label: 'Чт', full: 'Четверг' },
  { key: 'пт', label: 'Пт', full: 'Пятница' },
  { key: 'сб', label: 'Сб', full: 'Суббота' },
  { key: 'вс', label: 'Вс', full: 'Воскресенье' },
];

export function CalendarWorkspace({
  animeList,
  userAnimeMap,
  isLoggedIn,
}: CalendarWorkspaceProps) {
  // 1. Timezone detection & Live clock
  const [userTimezone, setUserTimezone] = useState<string>('UTC+3, Москва');
  const [localTime, setLocalTime] = useState<string>('');
  const [tokyoTime, setTokyoTime] = useState<string>('');

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetHours = -new Date().getTimezoneOffset() / 60;
      const sign = offsetHours >= 0 ? '+' : '';
      setUserTimezone(`${tz.split('/').pop()?.replace(/_/g, ' ') || tz} (UTC${sign}${offsetHours})`);
    } catch {
      setUserTimezone('Москва (UTC+3)');
    }

    const updateClock = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTokyoTime(now.toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Week calculation: dates for Monday through Sunday
  const today = useMemo(() => new Date(), []);
  const todayDayIndex = (today.getDay() + 6) % 7; // 0=Mon, ..., 6=Sun
  const todayKey = WEEKDAYS[todayDayIndex].key;

  const [activeDay, setActiveDay] = useState<string>(todayKey);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterMode, setFilterMode] = useState<'all' | 'watchlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate day dates for the week
  const weekDates = useMemo(() => {
    const monday = new Date(today);
    const diff = today.getDate() - todayDayIndex;
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    return WEEKDAYS.map((w, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        ...w,
        dateNumber: d.getDate(),
        isToday: w.key === todayKey,
      };
    });
  }, [today, todayDayIndex, todayKey]);

  // 3. Map anime to their calculated local airing day
  const groupedAnime = useMemo(() => {
    const groups: Record<string, Anime[]> = {
      пн: [],
      вт: [],
      ср: [],
      чт: [],
      пт: [],
      сб: [],
      вс: [],
    };

    animeList.forEach((anime) => {
      let dayKey = anime.airing_day;

      // Always prioritize calculating from next_episode_at in viewer's local timezone
      if (anime.next_episode_at) {
        const airDate = new Date(anime.next_episode_at);
        const dayIdx = (airDate.getDay() + 6) % 7;
        dayKey = WEEKDAYS[dayIdx].key;
      }

      if (dayKey && groups[dayKey]) {
        groups[dayKey].push(anime);
      } else {
        // Fallback to today if ongoing but unassigned
        groups[todayKey].push(anime);
      }
    });

    return groups;
  }, [animeList, todayKey]);

  // 4. Counts
  const todayCount = groupedAnime[todayKey]?.length || 0;
  const weekCount = animeList.length;
  const watchlistCount = animeList.filter((a) => userAnimeMap[a.id]).length;

  // 5. Filter items for active day or full week
  const filterList = (list: Anime[]) => {
    return list.filter((item) => {
      // Watchlist filter
      if (filterMode === 'watchlist' && !userAnimeMap[item.id]) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleRu = item.title_ru?.toLowerCase() || '';
        const titleEn = item.title_en?.toLowerCase() || '';
        const studio = item.studio?.toLowerCase() || '';
        return titleRu.includes(q) || titleEn.includes(q) || studio.includes(q);
      }
      return true;
    });
  };

  const activeDayAnime = filterList(groupedAnime[activeDay] || []);

  // 6. User watchlist ongoing items for the sidebar
  const userUpcomingAnime = animeList.filter((a) => userAnimeMap[a.id]);

  // Export .ics calendar generator
  const handleExportIcs = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Animo//Anime Release Calendar//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    animeList.forEach((anime) => {
      if (anime.next_episode_at) {
        const start = new Date(anime.next_episode_at);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min duration
        const toIcsDate = (d: Date) =>
          d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${anime.id}@animo.app`,
          `DTSTAMP:${toIcsDate(new Date())}`,
          `DTSTART:${toIcsDate(start)}`,
          `DTEND:${toIcsDate(end)}`,
          `SUMMARY:Премьера: ${anime.title_ru || anime.title_en}`,
          `DESCRIPTION:Трансляция новой серии аниме ${anime.title_ru || anime.title_en} (${anime.format || 'ТВ'})`,
          `URL:https://animo.app/anime/${anime.slug || anime.id}`,
          'END:VEVENT'
        );
      }
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animo-schedule.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Decorative ambient background glows */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[560px] h-[560px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-96 right-10 w-[420px] h-[420px] bg-secondary-container/15 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
          
          {/* Breadcrumbs & Header Section */}
          <section className="flex flex-col gap-space-md">
            <nav className="flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                Главная
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Календарь релизов</span>
            </nav>

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-3xl">
                <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container-high w-fit border border-outline-variant/30">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Онгоинги · Прямой телеэфир
                  </span>
                </div>

                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Календарь выхода серий
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Точное расписание трансляций онгоингов в Японии с автоматическим пересчётом на ваше местное время ({userTimezone}). Никаких пиратских плееров — только проверенное расписание.
                </p>
              </div>

              {/* Quick stats badges */}
              <div className="flex flex-wrap items-center gap-space-sm shrink-0">
                <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">today</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Сегодня в эфире</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {todayCount} {todayCount === 1 ? 'серия' : 'серий'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20">
                  <div className="w-9 h-9 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">calendar_view_week</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">В расписании</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {weekCount} онгоингов
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-xl bg-secondary-container/20 shadow-sm border border-secondary/30">
                  <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">bookmark_added</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary-fixed">В вашем списке</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                      {watchlistCount} ожидаемых
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md p-space-sm rounded-2xl bg-surface-container-low shadow-sm border border-outline-variant/20">
              <div className="flex flex-wrap items-center gap-space-xs">
                {/* View toggles */}
                <div className="flex items-center p-1 rounded-xl bg-surface-container-high">
                  <button
                    type="button"
                    onClick={() => setViewMode('day')}
                    className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                      viewMode === 'day'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">view_day</span>
                    <span>По дням недели</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                      viewMode === 'week'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                    <span>Вся неделя</span>
                  </button>
                </div>

                <div className="h-6 w-[1px] bg-surface-container-highest mx-1 hidden sm:block" />

                {/* Filter toggle: All vs Watchlist */}
                <div className="flex items-center p-1 rounded-xl bg-surface-container-high">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                      filterMode === 'all'
                        ? 'bg-surface-container-highest text-on-surface font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Все релизы
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        window.location.href = '/login?redirect=/calendar';
                        return;
                      }
                      setFilterMode('watchlist');
                    }}
                    className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                      filterMode === 'watchlist'
                        ? 'bg-surface-container-highest text-on-surface font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>Только из «Моё аниме»</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">
                      {watchlistCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Timezone & Search */}
              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                  <span className="text-outline">Часовой пояс:</span>
                  <span className="font-semibold text-on-surface">{userTimezone}</span>
                </div>

                <div className="relative flex-1 sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск в расписании..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-high text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-bright transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Weekdays Selector Strip (Sticky Desktop Navigation) */}
          {viewMode === 'day' && (
            <section className="sticky top-16 z-30 py-space-xs bg-surface/90 backdrop-blur-xl">
              <div className="grid grid-cols-7 gap-space-xs sm:gap-space-sm p-space-xs rounded-2xl bg-surface-container-low shadow-md overflow-x-auto border border-outline-variant/20">
                {weekDates.map((day) => {
                  const isActive = activeDay === day.key;
                  const dayAnimeCount = filterList(groupedAnime[day.key] || []).length;

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setActiveDay(day.key)}
                      className={`relative flex flex-col items-center justify-between p-2 sm:p-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-primary-container/40 via-surface-container-highest to-surface-container-high shadow-lg border border-primary/40'
                          : 'bg-surface-container-high/60 hover:bg-surface-container-high hover:border-outline-variant/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full relative z-10">
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-label-sm text-label-sm font-bold ${
                              isActive ? 'text-primary' : day.isToday ? 'text-secondary' : 'text-outline'
                            }`}
                          >
                            {day.label}
                          </span>
                          {day.isToday && (
                            <span className="px-1 py-0.2 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[8px] uppercase tracking-wider font-bold">
                              Сегодня
                            </span>
                          )}
                        </div>
                        {day.isToday && (
                          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(255,176,205,0.9)] animate-pulse" />
                        )}
                      </div>

                      <span className="font-headline-md text-headline-md font-bold text-on-surface my-1 relative z-10">
                        {day.dateNumber}
                      </span>

                      <div className="flex items-center gap-1 relative z-10">
                        <span
                          className={`font-label-sm text-[11px] ${
                            isActive ? 'text-primary font-bold' : 'text-outline'
                          }`}
                        >
                          {dayAnimeCount} {dayAnimeCount === 1 ? 'тайтл' : 'тайтлов'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Main Layout: 2-Column Desktop Grid (Timeline 67% | Sidebar 33%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            
            {/* Left Column: Schedule List */}
            <div className="lg:col-span-8 flex flex-col gap-space-xl">
              {viewMode === 'day' ? (
                /* Single Day View */
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-highest">
                    <div className="flex items-center gap-space-sm">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary">
                        <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {WEEKDAYS.find((w) => w.key === activeDay)?.full}
                        {activeDay === todayKey && (
                          <span className="ml-2 text-secondary font-medium font-body-sm text-body-sm">
                            (Сегодня)
                          </span>
                        )}
                      </h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-outline font-label-sm text-label-sm">
                      {activeDayAnime.length} {activeDayAnime.length === 1 ? 'релиз' : 'релизов'}
                    </span>
                  </div>

                  {activeDayAnime.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-outline mb-1">
                        event_busy
                      </span>
                      <h3 className="font-title-card text-title-card font-bold text-on-surface">
                        В этот день нет премьер
                      </h3>
                      <p className="font-body-sm text-body-sm text-outline max-w-sm">
                        На этот день недели в расписании пока нет запланированных серий онгоингов. Попробуйте выбрать другой день или посмотреть всю неделю.
                      </p>
                      <button
                        type="button"
                        onClick={() => setViewMode('week')}
                        className="mt-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md transition-colors"
                      >
                        Показать всю неделю
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-space-md">
                      {activeDayAnime.map((anime) => (
                        <CalendarCard
                          key={anime.id}
                          anime={anime}
                          userStatus={userAnimeMap[anime.id]?.status}
                          userProgress={userAnimeMap[anime.id]?.progress}
                          userTimezone={userTimezone}
                          isLoggedIn={isLoggedIn}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Full Week View */
                <div className="flex flex-col gap-space-xl">
                  {WEEKDAYS.map((day) => {
                    const dayAnime = filterList(groupedAnime[day.key] || []);
                    if (dayAnime.length === 0) return null;

                    return (
                      <div key={day.key} className="flex flex-col gap-space-md">
                        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-highest">
                          <div className="flex items-center gap-space-sm">
                            <span
                              className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold font-label-md ${
                                day.key === todayKey
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-surface-container-high text-outline'
                              }`}
                            >
                              {day.label}
                            </span>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              {day.full}
                              {day.key === todayKey && (
                                <span className="ml-2 text-secondary font-medium font-body-sm text-body-sm">
                                  · Сегодня
                                </span>
                              )}
                            </h2>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-outline font-label-sm text-label-sm">
                            {dayAnime.length} {dayAnime.length === 1 ? 'релиз' : 'релизов'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-space-md">
                          {dayAnime.map((anime) => (
                            <CalendarCard
                              key={anime.id}
                              anime={anime}
                              userStatus={userAnimeMap[anime.id]?.status}
                              userProgress={userAnimeMap[anime.id]?.progress}
                              userTimezone={userTimezone}
                              isLoggedIn={isLoggedIn}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Sidebar Widgets */}
            <aside className="lg:col-span-4 flex flex-col gap-space-lg">
              
              {/* Widget 1: Personal Watchlist Upcoming */}
              <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low shadow-md border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px]">stars</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Ожидаемое вами
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                    {watchlistCount} {watchlistCount === 1 ? 'тайтл' : 'тайтлов'}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-outline">
                  Онгоинги из вашей вкладки «Моё аниме», выходящие в эфир:
                </p>

                {!isLoggedIn ? (
                  <div className="p-4 rounded-xl bg-surface-container text-center flex flex-col items-center gap-2">
                    <p className="font-body-sm text-on-surface-variant">
                      Войдите в аккаунт, чтобы отслеживать даты серий только ваших любимых тайтлов.
                    </p>
                    <Link
                      href="/login?redirect=/calendar"
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 transition-all"
                    >
                      Войти в аккаунт
                    </Link>
                  </div>
                ) : userUpcomingAnime.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface-container text-center flex flex-col items-center gap-2">
                    <p className="font-body-sm text-outline">
                      В вашем списке пока нет онгоингов из расписания. Добавьте выходящие тайтлы в «Смотрю» или «В планах».
                    </p>
                    <Link
                      href="/catalog"
                      className="text-primary hover:underline font-label-md text-label-md"
                    >
                      Перейти в каталог
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-space-sm">
                    {userUpcomingAnime.slice(0, 5).map((item) => (
                      <Link
                        key={item.id}
                        href={`/anime/${item.slug || item.id}`}
                        className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high/80 hover:bg-surface-container-high transition-all group"
                      >
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className="w-1.5 h-8 rounded-full bg-secondary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-title-card text-title-card text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                              {item.title_ru || item.title_en}
                            </span>
                            <span className="font-body-sm text-[11px] text-outline">
                              {item.airing_day ? `Каждый ${item.airing_day.toUpperCase()}` : 'В эфире'}
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                          arrow_forward
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Widget 2: Sync / Export Schedule */}
              <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low shadow-md border border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">sync</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Экспорт расписания
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Синхронизируйте даты выхода серий с Google Calendar, Apple Calendar или личным расписанием.
                </p>

                <div className="flex flex-col gap-space-xs">
                  <button
                    type="button"
                    onClick={handleExportIcs}
                    className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                      <span className="font-label-md text-label-md">iCal / Google Calendar</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">file_download</span>
                  </button>

                  <Link
                    href="https://t.me"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">send</span>
                      <span className="font-label-md text-label-md">Telegram-канал премьер</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">open_in_new</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Ссылка на расписание скопирована в буфер обмена!');
                    }}
                    className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px]">link</span>
                      <span className="font-label-md text-label-md">Поделиться ссылкой</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">content_copy</span>
                  </button>
                </div>
              </section>

              {/* Widget 3: Timezone Dual Clocks & Explanation */}
              <section className="flex flex-col gap-space-sm p-space-lg rounded-2xl bg-surface-container-low shadow-md border border-outline-variant/20">
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">schedule</span>
                  <h3 className="font-title-card text-title-card text-on-surface font-semibold">
                    Живое время вещания
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-surface-container rounded-xl">
                  <div className="flex flex-col p-2 bg-surface-container-high rounded-lg">
                    <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                      Ваше местное
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary mt-1 font-mono">
                      {localTime || '—'}
                    </span>
                  </div>

                  <div className="flex flex-col p-2 bg-surface-container-high rounded-lg">
                    <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                      Токио (JST, UTC+9)
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-secondary mt-1 font-mono">
                      {tokyoTime || '—'}
                    </span>
                  </div>
                </div>

                <p className="font-body-sm text-[12px] text-outline mt-2 leading-relaxed">
                  Японские телеканалы транслируют серии по местному времени (JST). «Анимо» автоматически пересчитывает дату и время каждой премьеры в ваш локальный часовой пояс.
                </p>
              </section>

            </aside>

          </div>

        </div>
      </div>
    </div>
  );
}
