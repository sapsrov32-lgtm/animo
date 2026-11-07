'use client';

import React, { useState } from 'react';

interface AnimePlayerProps {
  shikimoriId?: number | null;
  anilistId?: number | null;
  titleRu?: string | null;
  titleEn?: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
}

export function AnimePlayer({
  shikimoriId,
  anilistId,
  titleRu,
  titleEn,
  posterUrl,
  bannerUrl,
}: AnimePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState<'kodik' | 'animeembed'>('kodik');
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Формирование ссылки для iframe с актуальными рабочими доменами
  const getPlayerUrl = () => {
    if (activePlayer === 'kodik') {
      // Рабочее зеркало Kodik без блокировок
      if (shikimoriId) {
        return `https://kodikplayer.com/find-player?shikimoriID=${shikimoriId}`;
      }
      const title = titleRu || titleEn || '';
      return `https://kodikplayer.com/find-player?title=${encodeURIComponent(title)}`;
    }

    if (activePlayer === 'animeembed') {
      // Плеер AnimeEmbed (по AniList ID или Shikimori/MAL ID)
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

  const bgImage = bannerUrl || posterUrl;
  const displayTitle = titleRu || titleEn || 'Аниме';

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
            <span className="material-symbols-outlined text-[20px] fill-current">play_circle</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Смотреть онлайн
            </h2>
            <p className="font-body-xs text-xs text-outline">
              Озвучка (AniLibria, SHIZA, Дубликат) и субтитры
            </p>
          </div>
        </div>

        {/* Source switch & Cinema toggle */}
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
      </div>

      {/* 16:9 Video Player Box */}
      <div
        className={`relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-outline-variant/30 shadow-2xl transition-all duration-300 ${
          isCinemaMode ? 'relative z-50 shadow-primary/20 shadow-2xl' : ''
        }`}
      >
        {!isPlaying ? (
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
      <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-outline px-1 gap-1">
        <span>Если серия долго грузится, переключитесь на «Плеер 2».</span>
        <span>Плеер адаптирован под телефон и полноэкранный режим.</span>
      </div>
    </section>
  );
}
