'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { UserProfile, UserAnime } from '@/types';
import { getDisplayTitle } from '@/lib/format';

interface StoryCardProps {
  profile: UserProfile | null;
  stats: {
    totalEpisodes: number;
    totalHours: number;
    topGenreName: string;
    topGenrePercent: number;
    avgScore: number | null;
  };
  topAnime: UserAnime[];
}

export function StoryCard({ profile, stats, topAnime }: StoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const currentYear = new Date().getFullYear();

  const getProxiedImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.includes('s4.anilist.co')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleDownload = async () => {
    if (!cardRef.current || isExporting || !profile) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `animo-story-${profile.username || 'recap'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Guest State
  if (!profile) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center gap-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center border border-secondary/30">
          <span className="material-symbols-outlined text-3xl">auto_awesome</span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
            Войдите, чтобы увидеть свою статистику
          </h3>
          <p className="font-body-sm text-xs text-outline leading-relaxed max-w-xs">
            Сохраняйте серии, ставьте оценки и отслеживайте личную статистику и итоги {currentYear} года.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full pt-2">
          <Link
            href="/login"
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            Войти
          </Link>
          <Link
            href="/login?tab=signup"
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface font-label-md text-sm font-semibold border border-outline-variant/30 hover:bg-surface-bright active:scale-95 transition-all"
          >
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-secondary text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            История года {currentYear}
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
          Формат 9:16
        </span>
      </div>

      {/* 9:16 Physical Aspect Container */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-surface-container-lowest flex flex-col justify-between p-6 select-none group border border-outline-variant/30"
      >
        {/* Layered Background Artwork with Glow and Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/80 via-surface-container-lowest/95 to-surface-container-lowest pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

        {/* Story Header */}
        <div className="relative z-10 flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high text-secondary border border-secondary/40">
              <span className="material-symbols-outlined text-[16px]">filter_vintage</span>
            </span>
            <span className="font-label-md text-label-md font-bold text-on-surface tracking-wider">
              ИТОГИ {currentYear} • АНИМО
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-high/80 text-secondary-fixed font-badge-score text-badge-score">
            ANNUAL
          </span>
        </div>

        {/* Story Center Content: Big Metrics & Rankings */}
        <div className="relative z-10 flex flex-col gap-3.5 py-2">
          {/* User Mini Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden shadow-md border border-secondary/40 flex items-center justify-center">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProxiedImageUrl(profile.avatar_url)}
                  alt={profile.username}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-title-card text-title-card font-bold text-on-surface leading-tight">
                {profile.username || 'Аниме Зритель'}
              </span>
              <span className="font-body-sm text-[11px] text-outline">
                {profile.role === 'admin'
                  ? 'Ранг: Администратор'
                  : profile.role === 'editor'
                  ? 'Ранг: Киномастер'
                  : 'Ранг: Зритель клуба'}
              </span>
            </div>
          </div>

          {/* Big Stat Impact Numbers */}
          <div className="rounded-2xl bg-surface-container-high/70 p-3.5 backdrop-blur-md shadow-md flex items-center justify-between border border-outline-variant/20">
            <div>
              <span className="font-body-sm text-[11px] text-outline block">Всего просмотрено</span>
              <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                {stats.totalEpisodes} эп.
              </span>
            </div>
            <div className="w-px h-8 bg-outline-variant/40" />
            <div className="text-right">
              <span className="font-body-sm text-[11px] text-outline block">Время за просмотром</span>
              <span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">
                {stats.totalHours} ч.
              </span>
            </div>
          </div>

          {/* Favorite Genre Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low/90 backdrop-blur-sm border border-outline-variant/20">
            <span className="font-body-sm text-[11px] text-outline">Главный жанр года:</span>
            <span className="font-label-md text-label-md font-bold text-tertiary">
              {stats.topGenreName || 'Не определён'}{' '}
              {stats.topGenrePercent > 0 ? `(${stats.topGenrePercent}%)` : ''}
            </span>
          </div>

          {/* Top 5 Titles Compact Ranking */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
              ТОП-5 Тайтлов Года
            </span>

            {topAnime.length === 0 ? (
              <div className="p-3 rounded-xl bg-surface-container-high/30 text-center font-body-sm text-[12px] text-outline">
                Пока пусто, добавь первый тайтл в список
              </div>
            ) : (
              topAnime.slice(0, 5).map((item, index) => {
                const anime = item.anime;
                if (!anime) return null;
                const displayTitle = getDisplayTitle(anime);
                const scoreValue = item.score || anime.score;

                return (
                  <div
                    key={item.anime_id}
                    className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-surface-container-high/50 border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-badge-score text-badge-score font-bold w-3 text-center ${
                          index === 0
                            ? 'text-secondary'
                            : index === 1
                            ? 'text-primary'
                            : 'text-outline'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="w-6 h-8 rounded bg-surface-container overflow-hidden shrink-0 relative">
                        {anime.poster_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getProxiedImageUrl(anime.poster_url)}
                            alt={displayTitle}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container" />
                        )}
                      </div>
                      <span className="font-title-card text-[12px] text-on-surface truncate max-w-[170px]">
                        {displayTitle}
                      </span>
                    </div>
                    {scoreValue && (
                      <span className="shrink-0 font-badge-score text-[12px] text-secondary-fixed">
                        ★ {typeof scoreValue === 'number' ? scoreValue.toFixed(1) : scoreValue}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Story Footer With Brand & Stylized QR code representation */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container-high p-1 text-on-surface flex items-center justify-center">
              <svg className="w-full h-full text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h2v2h-2v-2zm-4-2h2v4h-2v-4zm6 6h2v2h-2v-2zm-6 0h2v2h-2v-2zm4-4h2v2h-2v-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-[9px] text-outline uppercase tracking-wider">
                Каталог и трекер
              </span>
              <span className="font-body-sm text-[10px] font-semibold text-primary">
                animo.app
              </span>
            </div>
          </div>
          <span className="font-body-sm text-[10px] text-outline/80">#AnimoRecap</span>
        </div>
      </div>

      {/* Export Action Button */}
      <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto w-full pt-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md text-label-md font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
        >
          {isExporting ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>Сохранение картинки...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Сохранить картинкой (9:16)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
