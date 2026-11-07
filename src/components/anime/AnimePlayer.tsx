'use client';

import React, { useState } from 'react';

interface AnimePlayerProps {
  shikimoriId?: number | null;
  anilistId?: number | null;
  titleRu?: string | null;
  titleEn?: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
  status?: string | null;
  year?: number | null;
  episodes?: number | null;
}

export function AnimePlayer({
  shikimoriId,
  anilistId,
  titleRu,
  titleEn,
  posterUrl,
  bannerUrl,
  status,
  year,
  episodes,
}: AnimePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState<'kodik' | 'animeembed'>('kodik');
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  const displayTitle = titleRu || titleEn || 'Аниме';
  const bgImage = bannerUrl || posterUrl;

  // Проверка: анонсирован ли тайтл и вышел ли он в эфир
  const isAnnounced = status === 'announced' || (typeof year === 'number' && year > 2026);

  // Формирование ссылки для iframe с актуальными рабочими доменами
  const getPlayerUrl = () => {
    if (activePlayer === 'kodik') {
      if (shikimoriId) {
        return `https://kodikplayer.com/find-player?shikimoriID=${shikimoriId}`;
      }
      const title = titleRu || titleEn || '';
      return `https://kodikplayer.com/find-player?title=${encodeURIComponent(title)}`;
    }

    if (activePlayer === 'animeembed') {
      if (anilistId) {
        return `https://animeembed.com/embed/ani/${anilistId}/1`;
      }
      if (shikimoriId) {
        return `https://animeembed.com/embed/mal/${shikimoriId}/1`;
      }
      return `https://kodikplayer.com/find-player?title=${encodeURIComponent(titleRu || titleEn || '')}`;
    }

    return `https://kodikplayer.com/find-player?shikimoriID=${shikimoriId || ''}`;
  };

  return (
    <section className={`w-full flex flex-col gap-3 sm:gap-4 transition-all duration-500 ${isCinemaMode ? 'relative z-50' : ''}`}>
      {/* Cinema Mode Backdrop */}
      {isCinemaMode && (
        <div
          className="fixed inset-0 bg-black/90 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsCinemaMode(false)}
        />
      )}

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
            <span className="material-symbols-outlined text-[20px] fill-current">
              {isAnnounced ? 'event_upcoming' : 'play_circle'}
            </span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {isAnnounced ? 'Премьера ожидается' : 'Смотреть онлайн'}
            </h2>
            <p className="font-body-xs text-xs text-outline">
              {isAnnounced
                ? 'Тайтл находится в статусе официального анонса'
                : 'Озвучка (AniLibria, SHIZA, Дубликат) и субтитры'}
            </p>
          </div>
        </div>

        {/* Source switch & Cinema toggle (only if released) */}
        {!isAnnounced && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => setActivePlayer('kodik')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all font-medium touch-manipulation active:scale-95 ${
                  activePlayer === 'kodik'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Плеер 1 (Kodik)
              </button>
              <button
                type="button"
                onClick={() => setActivePlayer('animeembed')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all font-medium touch-manipulation active:scale-95 ${
                  activePlayer === 'animeembed'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Плеер 2 (AnimeEmbed)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              title={isCinemaMode ? 'Выйти из режима кинотеатра' : 'Режим кинотеатра'}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center touch-manipulation active:scale-95 ${
                isCinemaMode
                  ? 'bg-secondary text-on-secondary border-secondary'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCinemaMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 16:9 Player / Announcement Box */}
      <div
        className={`relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-outline-variant/30 shadow-2xl transition-all duration-300 ${
          isCinemaMode ? 'relative z-50 shadow-primary/20 shadow-2xl' : ''
        }`}
      >
        {isAnnounced ? (
          /* Announced / Unreleased Title Banner */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {bgImage && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30"
                style={{ backgroundImage: `url('${bgImage}')` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-surface-container-lowest/40" />

            <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6 max-w-lg">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 text-secondary border border-secondary/30 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-3xl">event_upcoming</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Серии ещё не вышли в эфир
                </h3>
                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Официальная премьера «{displayTitle}» запланирована на {year ? `${year} год` : 'будущие сезоны'}. Как только состоится релиз в Японии, видеоплеер со всеми вариантами озвучек станет доступен здесь автоматически.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-secondary border border-secondary/30 font-medium">
                  Статус: Официальный анонс
                </span>
                {year && (
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-outline border border-outline-variant/30">
                    Релиз: {year} г.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : !isPlaying ? (
          /* Atmospheric Poster Placeholder with Instant Launch Button */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {bgImage && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-sm scale-105 opacity-40 transition-transform duration-700"
                style={{ backgroundImage: `url('${bgImage}')` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-surface-container-lowest/20" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-surface-container-lowest/40 to-surface-container-lowest" />

            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 text-center px-4 max-w-lg">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary text-on-primary shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 touch-manipulation"
                aria-label="Запустить видеоплеер"
              >
                <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl ml-1 fill-current">
                  play_arrow
                </span>
                <span className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping pointer-events-none" />
              </button>

              <div className="flex flex-col gap-1 sm:gap-1.5">
                <p className="font-headline-sm text-body-lg sm:text-headline-sm font-bold text-on-surface tracking-tight">
                  Смотреть «{displayTitle}»
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[13px] sm:text-[14px]">high_quality</span>
                    HD Качество
                  </span>
                  <span>•</span>
                  <span>Выбор озвучки и серий</span>
                  <span>•</span>
                  <span>Субтитры</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Iframe video container */
          <iframe
            src={getPlayerUrl()}
            width="100%"
            height="100%"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
            title={`Плеер для ${displayTitle}`}
          />
        )}
      </div>

      {/* Helpful tips bar */}
      {!isAnnounced && (
        <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-outline px-1 gap-1">
          <span>Если в одном плеере нет нужной серии или озвучки, переключитесь на «Плеер 2» выше.</span>
          <span>Плеер адаптирован под телефон и полноэкранный режим.</span>
        </div>
      )}
    </section>
  );
}
