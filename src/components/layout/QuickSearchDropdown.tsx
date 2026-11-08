'use client';

import Image from 'next/image';
import Link from 'next/link';
import { QuickSearchResult } from '@/app/actions/catalog';

interface QuickSearchDropdownProps {
  query: string;
  results: QuickSearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;
  onSelect: (item: QuickSearchResult) => void;
  onViewAll: () => void;
}

export function QuickSearchDropdown({
  query,
  results,
  isLoading,
  isOpen,
  selectedIndex,
  onSelect,
  onViewAll,
}: QuickSearchDropdownProps) {
  if (!isOpen || query.trim().length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-surface-container-low/95 backdrop-blur-2xl border border-outline-variant/30 shadow-2xl overflow-hidden z-50 animate-fadeIn">
      {/* Header bar */}
      <div className="px-4 py-2 bg-surface-container/60 border-b border-outline-variant/20 flex items-center justify-between text-xs text-outline">
        <span>Быстрый поиск</span>
        {isLoading ? (
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            Поиск...
          </span>
        ) : (
          <span>{results.length > 0 ? `Найдено: ${results.length}` : 'Ничего не найдено'}</span>
        )}
      </div>

      {/* Results List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-outline-variant/10 py-1">
        {isLoading && results.length === 0 ? (
          // Skeleton loader
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-11 h-15 rounded-lg bg-surface-container-highest shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                  <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          results.map((item, index) => {
            const isSelected = index === selectedIndex;
            const titlePrimary = item.title_ru || item.title_en || 'Без названия';
            const titleSecondary = item.title_ru && item.title_en ? item.title_en : null;

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                onMouseDown={(e) => e.preventDefault()} // Prevents blur before click
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-container-high'
                    : 'hover:bg-surface-container/70'
                }`}
              >
                {/* Poster Thumbnail */}
                <div className="relative w-11 h-15 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 shadow-sm border border-outline-variant/20">
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={titlePrimary}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-[18px]">movie</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    {titlePrimary}
                  </span>
                  {titleSecondary && (
                    <span className="font-body-sm text-[11px] text-outline truncate">
                      {titleSecondary}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.format && (
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-[10px] leading-tight">
                        {item.format}
                      </span>
                    )}
                    {item.year && (
                      <span className="font-body-sm text-[11px] text-outline">
                        {item.year}
                      </span>
                    )}
                    {typeof item.score === 'number' && item.score > 0 && (
                      <span className="font-label-sm text-[11px] font-bold text-secondary flex items-center gap-0.5">
                        <span
                          className="material-symbols-outlined text-[12px] text-secondary fill-current"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {item.score.toFixed(1)}
                      </span>
                    )}
                    <span className="font-body-sm text-[10px] text-outline ml-auto">
                      {item.status === 'ongoing' ? (
                        <span className="text-secondary flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse" />
                          Онгоинг
                        </span>
                      ) : (
                        'Завершен'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-outline">
            <span className="material-symbols-outlined text-3xl mb-1 text-outline/60">
              search_off
            </span>
            <p className="font-body-md text-sm text-on-surface-variant">
              Ничего не найдено по запросу «{query}»
            </p>
            <p className="font-body-sm text-xs text-outline mt-1">
              Попробуйте изменить формулировку или поискать на английском
            </p>
          </div>
        )}
      </div>

      {/* Footer "View all in catalog" */}
      <div
        onClick={onViewAll}
        onMouseDown={(e) => e.preventDefault()}
        className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary cursor-pointer transition-colors"
      >
        <span>Все результаты по запросу «{query.trim()}»</span>
        <span className="flex items-center gap-1">
          <span className="font-normal text-outline text-[11px]">Enter ↵</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </span>
      </div>
    </div>
  );
}
