'use client';

import React, { useState } from 'react';

interface AnimePlayerProps {
  shikimoriId?: number | null;
  titleRu?: string | null;
  titleEn?: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
}

export function AnimePlayer({
  shikimoriId,
  titleRu,
  titleEn,
  posterUrl,
  bannerUrl,
}: AnimePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState<'kodik' | 'shikivideo'>('kodik');
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Формирование ссылки для iframe
  const getPlayerUrl = () => {
    if (activePlayer === 'kodik') {
      if (shikimoriId) {
        return `https://kodik.cc/find-player?shikimoriID=${shikimoriId}`;
      }
      const title = titleRu || titleEn || '';
      return `https://kodik.cc/find-player?title=${encodeURIComponent(title)}`;
    }

    if (activePlayer === 'shikivideo') {
      if (shikimoriId) {
        return `https://shiki-video.org/embed/${shikimoriId}`;
      }
      return `https://kodik.cc/find-player?title=${encodeURIComponent(titleRu || titleEn || '')}`;
    }

    return `https://kodik.cc/find-player?shikimoriID=${shikimoriId || ''}`;
  };

  const bgImage = bannerUrl || posterUrl;
  const displayTitle = titleRu || titleEn || 'Аниме';

  return (
    <section className={`w-full flex flex-col gap-4 transition-all duration-500 ${isCinemaMode ? 'relative z-50' : ''}`}>
      {/* Cinema Mode Backdrop */}
      {isCinemaMode && (
        <div
          className="fixed inset-0 bg-black/90 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsCinemaMode(false)}
        />
      )}

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-[20px] fill-current">play_circle</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Смотреть онлайн
            </h2>
            <p className="font-body-xs text-xs text-outline">
              Озвучка, субтитры и выбор серии доступны прямо в плеере
            </p>
          </div>
        </div>

        {/* Source switch & Cinema toggle */}
        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => setActivePlayer('kodik')}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  activePlayer === 'kodik'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Плеер 1 (Kodik)
              </button>
              <button
                type="button"
                onClick={() => setActivePlayer('shikivideo')}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  activePlayer === 'shikivideo'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Плеер 2 (Shikimori)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              title={isCinemaMode ? 'Выйти из режима кинотеатра' : 'Режим кинотеатра'}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
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

      {/* 16:9 Video Player Box */}
      <div
        className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-outline-variant/30 shadow-2xl transition-all duration-300 ${
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

            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4 max-w-lg">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="group relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-on-primary shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300"
                aria-label="Запустить видеоплеер"
              >
                <span className="material-symbols-outlined text-4xl md:text-5xl ml-1 fill-current">
                  play_arrow
                </span>
                <span className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping pointer-events-none" />
              </button>

              <div className="flex flex-col gap-1.5">
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                  Смотреть «{displayTitle}»
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[14px]">high_quality</span>
                    HD Качество
                  </span>
                  <span>•</span>
                  <span>AniLibria, SHIZA, Дубликат</span>
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
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            title={`Плеер для ${displayTitle}`}
          />
        )}
      </div>

      {/* Helpful tips bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-outline px-1">
        <span>Если серия не загружается, переключитесь на «Плеер 2» вверху.</span>
        <span>Плеер адаптирован под мобильные устройства и полноэкранный режим.</span>
      </div>
    </section>
  );
}
