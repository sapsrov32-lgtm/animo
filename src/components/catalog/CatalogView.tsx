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

const FORMAT_OPTIONS = [
  { id: 'all', label: 'Все' },
  { id: 'ТВ Сериал', label: 'ТВ Сериал' },
  { id: 'Фильм', label: 'Фильм' },
  { id: 'OVA', label: 'OVA' },
  { id: 'ONA', label: 'ONA' },
  { id: 'Спешл', label: 'Спешл' },
];

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
  const [selectedFormat, setSelectedFormat] = useState<string>(initialParams.format || 'all');
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
        format: selectedFormat,
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
        setItems((prev) => {
          const ids = new Set(prev.map((i) => i.id));
          const unique = res.items.filter((i) => !ids.has(i.id));
          return [...prev, ...unique];
        });
      }
      setTotal(res.total);
      setPage(newPage);
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
    setSelectedFormat('all');
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
      format: selectedFormat,
      minScore,
      yearFrom,
      yearTo,
      sort: sortOption,
      page: nextPage,
      perPage: 24,
    });
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.id));
      const unique = res.items.filter((i) => !ids.has(i.id));
      return [...prev, ...unique];
    });
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  // Re-apply when dropdowns change
  useEffect(() => {
    applyFilters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre, selectedStatus, selectedFormat, sortOption, minScore, yearFrom, yearTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedGenre !== 'all' ||
    selectedStatus !== 'all' ||
    selectedFormat !== 'all' ||
    minScore !== undefined ||
    yearFrom !== undefined ||
    yearTo !== undefined;

  // Filter content component reused between desktop sidebar and mobile bottom sheet
  const renderFilterBody = () => (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">filter_list</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Фильтры
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-primary hover:text-primary-fixed font-label-md text-label-md transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* 1. FORMAT FILTER */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
          <span>Формат</span>
          <span className="font-label-sm text-label-sm text-outline">
            {selectedFormat !== 'all' ? selectedFormat : 'Все форматы'}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container rounded-xl">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFormat(f.id)}
              className={`py-1.5 rounded-lg text-center font-label-sm text-xs transition-all ${
                selectedFormat === f.id
                  ? 'bg-surface-container-highest text-on-surface font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-surface-container-highest/60" />

      {/* 2. GENRES CHIPS */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
          <span>Жанры</span>
          <span className="font-label-sm text-label-sm text-outline">
            {selectedGenre !== 'all' ? 'Выбран 1' : 'Все'}
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
              selectedGenre === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
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

      {/* 3. STATUS FILTER */}
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

      {/* 4. RATING THRESHOLD */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-label-md text-label-md text-on-surface-variant">
          Минимальный рейтинг: {minScore ? `★ ${minScore}` : 'Любой'}
        </label>
        <div className="grid grid-cols-5 gap-1 text-center">
          {[undefined, 7, 7.5, 8, 8.5].map((val) => (
            <button
              key={val === undefined ? 'any' : val}
              type="button"
              onClick={() => setMinScore(val)}
              className={`py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                minScore === val
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {val === undefined ? 'Все' : `${val}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-surface-container-highest/60" />

      {/* 5. RELEASE YEARS */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-label-md text-label-md text-on-surface-variant">
          Годы выхода
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="С (например 2020)"
            value={yearFrom || ''}
            onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-10 px-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none"
          />
          <input
            type="number"
            placeholder="По (например 2026)"
            value={yearTo || ''}
            onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-10 px-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header Banner */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-[16px]">database</span>
            <span>База данных тайтлов</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            Каталог аниме
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">
            Исследуйте полную коллекцию из {stats.total} тайтлов, фильтруйте по жанрам, форматам и оценкам.
          </p>
        </div>

        {/* Global Catalog Metrics Bento */}
        <div className="flex items-center gap-space-sm shrink-0">
          <div className="bg-surface-container-low px-space-md py-space-sm rounded-xl flex items-center gap-space-sm shadow-sm border border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-[22px]">auto_stories</span>
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
              placeholder="Поиск по названию или жанру аниме..."
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
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden h-11 min-h-[44px] px-space-md rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 touch-manipulation"
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
                  ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              #{g.name_ru}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid + Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Desktop Sidebar Filter Panel */}
        <aside className="hidden lg:flex lg:col-span-3 bg-surface-container-low rounded-2xl p-space-md border border-outline-variant/20 flex-col gap-space-lg sticky top-20 shadow-sm">
          {renderFilterBody()}
        </aside>

        {/* Mobile Slide-over Drawer / Bottom Sheet */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative bg-surface-container-low rounded-t-3xl border-t border-outline-variant/30 max-h-[85vh] overflow-y-auto p-6 z-10 shadow-2xl flex flex-col gap-4 animate-slideUp">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Фильтры каталога
                </span>
                <button
                  type="button"
                  aria-label="Закрыть фильтры"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {renderFilterBody()}

              <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full min-h-[44px] py-3 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  Применить фильтры (найдено {total})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Media Grid */}
        <section className="lg:col-span-9 flex flex-col gap-space-lg">
          {/* Results Summary Bar with reserved space for indicator to eliminate mobile reflow/jitter */}
          <div className="flex items-center justify-between min-h-[28px] text-outline font-body-sm text-body-sm">
            <span>
              Найдено: <strong className="text-on-surface">{total}</strong> тайтлов
            </span>
            <div className="flex items-center min-w-[120px] justify-end min-h-[24px]">
              <span
                className={`flex items-center gap-1.5 text-secondary transition-opacity duration-200 ${
                  isPending ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={!isPending}
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Обновление...
              </span>
            </div>
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
                className="px-6 h-10 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold"
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
                className="min-h-[48px] px-8 h-12 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
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
