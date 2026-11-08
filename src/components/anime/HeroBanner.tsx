'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Anime } from '@/types';
import { getDisplayTitle, getSecondaryTitle, cleanDescription } from '@/lib/format';

interface HeroBannerProps {
  anime: Anime;
  isLoggedIn?: boolean;
}

export function HeroBanner({ anime, isLoggedIn = false }: HeroBannerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const displayTitle = getDisplayTitle(anime);
  const secondaryTitle = getSecondaryTitle(anime);

  const handleSelectStatus = (statusName: string) => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setCurrentStatus(statusName);
    setDropdownOpen(false);
  };

  const genres =
    anime.genres ||
    anime.anime_genres?.map((ag) => ag.genres).filter(Boolean) ||
    [];

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest -mt-16 pt-24 pb-16 lg:pb-24">
      {/* Ambient Atmospheric Glows */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] bg-secondary/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Backdrop Visual Frame */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
        {(anime.banner_url || anime.poster_url) && (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${anime.banner_url || anime.poster_url}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-3xl flex flex-col gap-space-md">
          
          {/* Meta Pills & Badges */}
          <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm pt-4">
            {anime.score && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/30 text-secondary border-0 shadow-[0_0_16px_rgba(255,176,205,0.2)]">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-badge-score text-badge-score">
                  {anime.score > 9.5 ? '9.5' : anime.score.toFixed(1)}
                </span>
                <span className="text-secondary/60 text-xs px-1">•</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">TOP Рейтинга</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/70 text-on-surface-variant font-label-md text-label-md">
              <span>{anime.format || 'ТВ Сериал'}</span>
              <span className="text-outline text-xs">•</span>
              <span>{anime.episodes ? `${anime.episodes} эп.` : 'Онгоинг'}</span>
              {anime.studio && (
                <>
                  <span className="text-outline text-xs">•</span>
                  <span className="text-primary-fixed">{anime.studio}</span>
                </>
              )}
              {anime.year && (
                <>
                  <span className="text-outline text-xs">•</span>
                  <span>{anime.year}</span>
                </>
              )}
            </div>
          </div>

          {/* Titles: Callout & Main */}
          <div className="flex flex-col gap-1">
            {secondaryTitle && (
              <span className="font-title-card text-title-card text-secondary/80 tracking-widest uppercase">
                {secondaryTitle}
              </span>
            )}
            <h1 className="font-display-hero text-display-hero-mobile sm:text-display-hero text-on-surface tracking-tight leading-[1.08] drop-shadow-md">
              {displayTitle}
            </h1>
          </div>

          {/* Genres Chips */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.slice(0, 4).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/catalog?genre=${genre.slug}`}
                  className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {genre.name_ru}
                </Link>
              ))}
            </div>
          )}

          {/* Synopsis Narrative */}
          <p className="font-body-lg text-body-lg text-on-surface-variant/90 max-w-2xl leading-relaxed line-clamp-3">
            {anime.description
              ? /[а-яё]/i.test(anime.description)
                ? cleanDescription(anime.description)
                : 'Описание на русском пока нет'
              : 'Описание на русском пока нет'}
          </p>

          {/* CTA & Status Tracker Cluster */}
          <div className="flex flex-wrap items-center gap-space-sm pt-2">
            {/* Primary CTA Button */}
            <Link
              href={`/anime/${anime.slug || anime.id}`}
              prefetch={true}
              className="group flex items-center gap-2 px-6 h-11 rounded-full bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-label-md text-label-md shadow-[0_0_24px_rgba(160,120,255,0.45)] hover:shadow-[0_0_32px_rgba(160,120,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Подробнее о тайтле</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </Link>

            {/* Tracking Dropdown Interactive Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    window.location.href = '/login';
                  } else {
                    setDropdownOpen(!dropdownOpen);
                  }
                }}
                className="flex items-center gap-2 px-5 h-11 rounded-full bg-surface-container-high/90 hover:bg-surface-bright text-on-surface font-label-md text-label-md shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bookmark
                </span>
                <span>{currentStatus || 'Добавить в список'}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">
                  expand_more
                </span>
              </button>

              {/* Quick Selection Floating Dropdown */}
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 p-1.5 rounded-xl bg-surface-container-highest shadow-2xl z-30">
                  <button
                    type="button"
                    onClick={() => handleSelectStatus('В планах')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      В планах
                    </span>
                    <span className="text-xs text-outline">Хочу</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectStatus('Смотрю')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      Смотрю
                    </span>
                    <span className="text-xs text-outline">В процессе</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectStatus('Просмотрено')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Просмотрено
                    </span>
                    <span className="material-symbols-outlined text-xs text-primary">done</span>
                  </button>
                </div>
              )}
            </div>

            {/* Watchlist Count Counter Pill */}
            <div className="hidden sm:flex items-center gap-2 px-4 h-11 rounded-full bg-surface-container-lowest/60 text-outline font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              <span>Без пиратства и рекламы</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
