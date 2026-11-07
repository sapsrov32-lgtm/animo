'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Anime } from '@/types';
import { HeroBanner } from '@/components/anime/HeroBanner';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AiringCard } from '@/components/anime/AiringCard';
import { getDisplayTitle } from '@/lib/format';

interface HomeViewProps {
  heroAnime: Anime;
  popularAnime: Anime[];
  ongoingAnime: Anime[];
  seasonalAnime: Anime[];
}

export function HomeView({
  heroAnime,
  popularAnime,
  ongoingAnime,
  seasonalAnime,
}: HomeViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSeasonTab, setSelectedSeasonTab] = useState('Все');
  const [airingFilter, setAiringFilter] = useState<'all' | 'my'>('all');

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const seasonTabs = ['Все', 'Экшен', 'Драма', 'Фэнтези', 'Комедия'];

  // Filter seasonal anime by genre tab
  const filteredSeasonal =
    selectedSeasonTab === 'Все'
      ? seasonalAnime
      : seasonalAnime.filter((item) =>
          item.anime_genres?.some((ag) => ag.genres?.name_ru === selectedSeasonTab)
        );

  return (
    <div className="flex flex-col w-full">
      {/* 1. CINEMATIC HERO BANNER */}
      <HeroBanner anime={heroAnime} />

      {/* 2. POPULAR NOW (HORIZONTAL CAROUSEL) */}
      <section className="w-full py-10 lg:py-14 bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="flex items-end justify-between mb-6 pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Тренды сообщества
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Популярное сейчас
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/catalog?sort=popularity"
                className="hidden sm:inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors"
              >
                <span>Смотреть все</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Предыдущий тайтл"
                  onClick={() => scrollCarousel('left')}
                  className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  aria-label="Следующий тайтл"
                  onClick={() => scrollCarousel('right')}
                  className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Carousel container */}
          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-cols-[calc(50%-8px)] sm:auto-cols-[calc(33.33%-12px)] md:auto-cols-[calc(25%-12px)] lg:auto-cols-[calc(20%-13px)] gap-4 lg:gap-5 overflow-x-auto scroll-smooth pb-4"
          >
            {popularAnime.map((anime, idx) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                badge={idx === 0 ? '#1 В трендах' : undefined}
                badgeType={idx === 0 ? 'trend' : 'default'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. AIRING TODAY / ONGOING RELEASES (WITH VIEWER LOCAL TIMERS) */}
      <section className="w-full py-12 lg:py-16 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                  Прямой эфир и график релизов
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Выходит сейчас
                </h2>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">
                  Онгоинги
                </span>
              </div>
            </div>

            {/* Filter Segmented Control */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-low">
              <button
                type="button"
                onClick={() => setAiringFilter('all')}
                className={`px-4 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  airingFilter === 'all'
                    ? 'bg-surface-container text-on-surface shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Все релизы ({ongoingAnime.length})
              </button>
              <button
                type="button"
                onClick={() => setAiringFilter('my')}
                className={`px-4 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  airingFilter === 'my'
                    ? 'bg-surface-container text-on-surface shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Из моего списка (0)
              </button>
            </div>
          </div>

          {/* Schedule Bento Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {ongoingAnime.length > 0 ? (
              (airingFilter === 'all' ? ongoingAnime : []).map((item) => (
                <AiringCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  title={getDisplayTitle(item)}
                  studio={item.studio}
                  next_episode_at={item.next_episode_at}
                  poster_url={item.poster_url}
                  episode_num={item.episodes ? Math.min(item.episodes, 12) : undefined}
                />
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-surface-container-low rounded-2xl text-outline">
                Новые серии ожидаются в ближайшее время.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. SMART MOOD DISCOVERY BANNER (WHAT TO WATCH) */}
      <section className="w-full py-12 lg:py-16 bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest p-8 md:p-12 shadow-2xl">
            {/* Visual Accent Glows */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Персональный навигатор «Анимо»</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Не знаешь, что посмотреть сегодня вечером?
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Умный алгоритм рекомендаций анализирует настроение, доступное время и любимые жанры, подбирая тайтлы буквально за 3 клика.
              </p>

              {/* Mood Chips */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Link
                  href="/recommend?mood=adrenaline"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest/80 hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                >
                  🔥 Адреналин и драйв
                </Link>
                <Link
                  href="/recommend?mood=cozy"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest/80 hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                >
                  🌙 Меланхоличный уют
                </Link>
                <Link
                  href="/recommend?mood=mindgame"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest/80 hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                >
                  🧠 Сложный майндгейм
                </Link>
                <Link
                  href="/recommend?mood=romance"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest/80 hover:bg-secondary-container hover:text-on-secondary-container text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                >
                  🌸 Тёплая романтика
                </Link>
                <Link
                  href="/recommend?mood=relax"
                  className="px-4 py-2 rounded-full bg-surface-container-lowest/80 hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
                >
                  🍜 Легкий отдых
                </Link>
              </div>

              {/* Master Action */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/recommend"
                  className="flex items-center gap-2.5 px-8 h-12 rounded-full bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-label-md text-label-md shadow-[0_0_28px_rgba(160,120,255,0.4)] hover:shadow-[0_0_36px_rgba(160,120,255,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  <span>Подобрать по настроению</span>
                </Link>
                <span className="font-body-sm text-body-sm text-outline">
                  Без спойлеров • Персональный гид
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEASONAL NEW RELEASES */}
      <section className="w-full py-10 lg:py-16 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block mb-1">
                Сезонный гид
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Новинки и свежие релизы
              </h2>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {seasonTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedSeasonTab(tab)}
                  className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
                    selectedSeasonTab === tab
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredSeasonal.slice(0, 8).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRACKER & YEAR STATS SHOWCASE («МОЙ ГОД В АНИМЕ») */}
      <section className="w-full py-12 lg:py-20 bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="flex flex-col lg:flex-row items-stretch gap-8">
            {/* Left: Context */}
            <div className="lg:w-1/3 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                  Личная аналитика
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Твой профиль и статистика «Анимо»
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-2">
                  Отслеживай серии в один тап, формируй честные личные списки и получай персональные итоги года без рекламы и видеоплееров.
                </p>
              </div>

              <div className="pt-6">
                <div className="p-4 rounded-2xl bg-surface-container-low flex items-center gap-4 mb-4 border border-outline-variant/20">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface block">
                      18 дней подряд
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">
                      Текущая серия активности в трекере
                    </span>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors"
                >
                  <span>Открыть полную аналитику профиля</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Right: Interactive Dashboard Widget */}
            <div className="lg:w-2/3 rounded-3xl bg-surface-container-low p-6 lg:p-8 shadow-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="font-title-card text-title-card text-on-surface">Мой год в аниме 2024</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                  Актуально
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1">
                  <span className="text-outline font-label-sm text-label-sm">Эпизодов</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">842</span>
                  <span className="text-[11px] text-tertiary">~14.6 дней жизни</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1">
                  <span className="text-outline font-label-sm text-label-sm">Завершено</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">48</span>
                  <span className="text-[11px] text-outline">Тайтлов</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1">
                  <span className="text-outline font-label-sm text-label-sm">Средний балл</span>
                  <span className="font-headline-md text-headline-md text-secondary font-bold">8.2</span>
                  <span className="text-[11px] text-outline">Из 10</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-1">
                  <span className="text-outline font-label-sm text-label-sm">Топ-жанр</span>
                  <span className="font-title-card text-title-card text-on-surface truncate">Психология</span>
                  <span className="text-[11px] text-primary">34% времени</span>
                </div>
              </div>

              {/* SVG Chart */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-outline font-label-sm text-label-sm">
                  <span>Сезонный темп просмотра (эпизодов по месяцам)</span>
                  <span>Пик: Август (112 эп.)</span>
                </div>
                <div className="w-full h-24 pt-2">
                  <svg className="w-full h-full overflow-visible text-primary" viewBox="0 0 500 80">
                    <rect className="fill-surface-container hover:fill-surface-container-highest transition-colors" height="35" rx="4" width="28" x="10" y="45" />
                    <rect className="fill-surface-container hover:fill-surface-container-highest transition-colors" height="45" rx="4" width="28" x="52" y="35" />
                    <rect className="fill-surface-container hover:fill-surface-container-highest transition-colors" height="52" rx="4" width="28" x="94" y="28" />
                    <rect className="fill-surface-container hover:fill-surface-container-highest transition-colors" height="40" rx="4" width="28" x="136" y="40" />
                    <rect className="fill-surface-container-highest hover:fill-primary/60 transition-colors" height="60" rx="4" width="28" x="178" y="20" />
                    <rect className="fill-surface-container hover:fill-surface-container-highest transition-colors" height="50" rx="4" width="28" x="220" y="30" />
                    <rect className="fill-surface-container-highest hover:fill-primary/60 transition-colors" height="65" rx="4" width="28" x="262" y="15" />
                    <rect className="fill-primary-container shadow-lg" height="78" rx="4" width="28" x="304" y="2" />
                    <rect className="fill-surface-container-highest hover:fill-primary/60 transition-colors" height="58" rx="4" width="28" x="346" y="22" />
                    <rect className="fill-secondary shadow-sm" height="68" rx="4" width="28" x="388" y="12" />
                    <rect className="fill-surface-container opacity-60" height="42" rx="4" width="28" x="430" y="38" />
                    <rect className="fill-surface-container-high opacity-30" height="10" rx="4" width="28" x="472" y="70" />
                  </svg>
                </div>
                <div className="flex justify-between text-[11px] text-outline pt-1 font-label-sm">
                  <span>Янв</span>
                  <span>Фев</span>
                  <span>Мар</span>
                  <span>Апр</span>
                  <span>Май</span>
                  <span>Июн</span>
                  <span>Июл</span>
                  <span className="text-primary-fixed font-bold">Авг</span>
                  <span>Сен</span>
                  <span className="text-secondary font-bold">Окт</span>
                  <span>Ноя</span>
                  <span>Дек</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMPLIANCE & CLARIFICATION BANNER */}
      <section className="w-full py-8 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-outline shrink-0">
                <span className="material-symbols-outlined text-[20px]">format_image_left</span>
              </div>
              <p className="font-body-sm text-body-sm text-outline max-w-2xl">
                «Анимо» — независимая база данных, каталог и система персонального трекинга аниме. Сервис не предоставляет услуги просмотра видео и не хранит медиафайлы.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-label-sm text-label-sm text-outline">Чистый интерфейс без рекламы</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
