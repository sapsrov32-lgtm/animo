'use client';

import { useState, useEffect, useTransition } from 'react';
import { Anime, Genre } from '@/types';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { fetchCatalogAnime, CatalogFilterParams } from '@/app/actions/catalog';

interface CatalogViewProps {
  initialItems: Anime[];
  initialTotal: number;
  genres: Genre[];
  stats: { total: number; ongoing: number };
  initialParams?: CatalogFilterParams;
}

export function CatalogView({
  initialItems,
  initialTotal,
  genres,
  stats,
  initialParams = {},
}: CatalogViewProps) {
  const [items, setItems] = useState<Anime[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);
  const [page, setPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialParams.query || '');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialParams.genre || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialParams.status || 'all');
  const [minScore, setMinScore] = useState<number | undefined>(initialParams.minScore);
  const [yearFrom, setYearFrom] = useState<number | undefined>(initialParams.yearFrom);
  const [yearTo, setYearTo] = useState<number | undefined>(initialParams.yearTo);
  const [sortOption, setSortOption] = useState<string>(initialParams.sort || 'popularity');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Trigger load when filters change
  const applyFilters = (newPage = 1) => {
    startTransition(async () => {
      const res = await fetchCatalogAnime({
        query: searchQuery,
        genre: selectedGenre,
        status: selectedStatus,
        minScore,
        yearFrom,
        yearTo,
        sort: sortOption,
        page: newPage,
        perPage: 24,
      });

      if (newPage === 1) {
        setItems(res.items);
      } else {
        setItems((prev) => [...prev, ...res.items]);
      }
      setTotal(res.total);
      setPage(newPage);
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
    setMinScore(undefined);
    setYearFrom(undefined);
    setYearTo(undefined);
    setSortOption('popularity');
    setPage(1);

    startTransition(async () => {
      const res = await fetchCatalogAnime({ page: 1, perPage: 24 });
      setItems(res.items);
      setTotal(res.total);
    });
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetchCatalogAnime({
      query: searchQuery,
      genre: selectedGenre,
      status: selectedStatus,
      minScore,
      yearFrom,
      yearTo,
      sort: sortOption,
      page: nextPage,
      perPage: 24,
    });
    setItems((prev) => [...prev, ...res.items]);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  // Re-apply when dropdowns change
  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedGenre, selectedStatus, minScore, yearFrom, yearTo, sortOption]);

  const activeGenreName = genres.find((g) => g.slug === selectedGenre)?.name_ru;
  const hasActiveFilters =
    searchQuery || selectedGenre !== 'all' || selectedStatus !== 'all' || minScore || yearFrom || yearTo;

  return (
    <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-8">
      {/* Top Header & Counters */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-8">
        <div>
          <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            База японской анимации
          </div>
          <h1 className="font-display-hero text-headline-lg md:text-display-hero text-on-surface tracking-tight">
            Каталог тайтлов
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">
            Исследуйте рейтинги, фильтруйте по любимым жанрам и добавляйте шедевры в личные коллекции без рекламы и видеоплееров.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-space-sm shrink-0">
          <div className="bg-surface-container-low px-space-md py-space-sm rounded-xl flex items-center gap-space-sm shadow-sm border border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-[22px]">auto_awesome</span>
            <div>
              <div className="font-label-sm text-label-sm text-outline uppercase">В каталоге</div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {stats.total}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low px-space-md py-space-sm rounded-xl flex items-center gap-space-sm shadow-sm border border-outline-variant/20">
            <span className="material-symbols-outlined text-tertiary text-[22px]">electric_bolt</span>
            <div>
              <div className="font-label-sm text-label-sm text-outline uppercase">Онгоингов</div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {stats.ongoing}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Search Bar & Quick Suggestion Row */}
      <section className="bg-surface-container-low rounded-2xl p-space-md mb-space-lg shadow-sm border border-outline-variant/20">
        <div className="flex flex-col md:flex-row gap-space-md items-stretch md:items-center justify-between">
          
          {/* Live Search Field */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Искать по названию (ромадзи/оригинал/рус) с триграммным индексом..."
              className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Sorting Dropdown & Mobile Filter Toggle */}
          <div className="flex items-center gap-space-sm shrink-0">
            <div className="relative">
              <select
                aria-label="Сортировка каталога"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none h-11 pl-4 pr-10 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer hover:bg-surface-container-high transition-colors focus:outline-none"
              >
                <option value="popularity">По популярности</option>
                <option value="score">По рейтингу ★</option>
                <option value="release_desc">По дате выхода (сначала новые)</option>
                <option value="release_asc">По дате выхода (старые)</option>
                <option value="title_asc">По алфавиту (A-Z)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden h-11 px-space-md rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Фильтры</span>
            </button>
          </div>
        </div>

        {/* Quick Tag Suggestions and Active Chips */}
        <div className="flex flex-wrap items-center gap-space-xs mt-space-sm pt-space-xs">
          <span className="font-label-sm text-label-sm text-outline uppercase mr-1">
            Быстрый выбор:
          </span>
          {genres.slice(0, 6).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGenre(selectedGenre === g.slug ? 'all' : g.slug)}
              className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm transition-all ${
                selectedGenre === g.slug
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              #{g.name_ru}
            </button>
          ))}

          {/* Active Filter Badge */}
          {hasActiveFilters && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm ml-2">
              <span>{activeGenreName || searchQuery || 'Фильтры активны'}</span>
              <button
                type="button"
                aria-label="Снять фильтр"
                onClick={handleResetFilters}
                className="hover:opacity-75 flex items-center"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid: Sidebar + Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* ================= SIDEBAR FILTERS ================= */}
        <aside
          className={`lg:col-span-3 bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-space-md shadow-sm border border-outline-variant/20 ${
            mobileFilterOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs font-title-card text-title-card text-on-surface font-bold">
              <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
              Параметры отбора
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-label-sm text-label-sm text-primary hover:text-secondary-fixed transition-colors flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Сбросить
              </button>
            )}
          </div>

          {/* 1. GENRES CHIPS */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
              <span>Жанры</span>
              <span className="font-label-sm text-label-sm text-outline">
                {selectedGenre !== 'all' ? 'Выбран 1' : 'Все'}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedGenre('all')}
                className={`px-3 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                  selectedGenre === 'all'
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Все жанры
              </button>
              {genres.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGenre(g.slug)}
                  className={`px-3 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                    selectedGenre === g.slug
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {g.name_ru}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-surface-container-highest/60" />

          {/* 2. STATUS FILTER */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">
              Статус трансляции
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`py-1.5 rounded-lg text-center font-label-sm text-label-sm transition-all ${
                  selectedStatus === 'all'
                    ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('ongoing')}
                className={`py-1.5 rounded-lg text-center font-label-sm text-label-sm transition-all ${
                  selectedStatus === 'ongoing'
                    ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Онгоинг
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('finished')}
                className={`py-1.5 rounded-lg text-center font-label-sm text-label-sm transition-all ${
                  selectedStatus === 'finished'
                    ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Завершён
              </button>
            </div>
          </div>

          <div className="h-px bg-surface-container-highest/60" />

          {/* 3. RATING THRESHOLD */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">
              Минимальная оценка
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setMinScore(undefined)}
                className={`py-1.5 rounded-lg font-label-sm text-label-sm text-center flex items-center justify-center gap-1 transition-all ${
                  minScore === undefined
                    ? 'bg-surface-container-highest text-on-surface font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span>Любой</span>
              </button>
              <button
                type="button"
                onClick={() => setMinScore(7.0)}
                className={`py-1.5 rounded-lg font-label-sm text-label-sm text-center flex items-center justify-center gap-1 transition-all ${
                  minScore === 7.0
                    ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="text-secondary">★</span> 7.0+
              </button>
              <button
                type="button"
                onClick={() => setMinScore(8.0)}
                className={`py-1.5 rounded-lg font-label-sm text-label-sm text-center flex items-center justify-center gap-1 transition-all ${
                  minScore === 8.0
                    ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="text-secondary-fixed">★</span> 8.0+
              </button>
            </div>
          </div>

          <div className="h-px bg-surface-container-highest/60" />

          {/* 4. RELEASE YEAR RANGE & PRESETS */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Год релиза
              </label>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {yearFrom || yearTo ? `${yearFrom || '...'} — ${yearTo || '...'}` : 'Все годы'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">От:</span>
                <input
                  type="number"
                  placeholder="1980"
                  value={yearFrom || ''}
                  onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-16 bg-transparent text-right font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
                />
              </div>
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">До:</span>
                <input
                  type="number"
                  placeholder="2026"
                  value={yearTo || ''}
                  onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-16 bg-transparent text-right font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  setYearFrom(2023);
                  setYearTo(2026);
                }}
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all"
              >
                Новинки 2023–2026
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearFrom(2010);
                  setYearTo(2022);
                }}
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all"
              >
                2010–2022
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearFrom(1980);
                  setYearTo(2009);
                }}
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all"
              >
                Ретро (до 2010)
              </button>
            </div>
          </div>
        </aside>

        {/* ================= CATALOG MEDIA GRID ================= */}
        <section className="lg:col-span-9 flex flex-col gap-space-lg">
          
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-outline font-body-sm text-body-sm">
            <span>
              Найдено: <strong className="text-on-surface">{total}</strong> тайтлов
            </span>
            {isPending && (
              <span className="flex items-center gap-1.5 text-secondary animate-pulse">
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Обновление...
              </span>
            )}
          </div>

          {/* Cards Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {items.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-surface-container-low rounded-2xl p-8 border border-outline-variant/20">
              <span className="material-symbols-outlined text-outline text-[48px] mb-3">
                search_off
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                Ничего не найдено
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
                Попробуйте изменить поисковый запрос или сбросить активные фильтры.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 h-10 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md"
              >
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Load More Button */}
          {items.length < total && (
            <div className="flex justify-center pt-6 pb-12">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                className="px-8 h-12 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    <span>Показать ещё (загружено {items.length} из {total})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
