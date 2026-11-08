'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserProfile, UserAnime, WatchStatus } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { StoryCard } from './StoryCard';
import { ShareButton } from '@/components/anime/ShareButton';

interface PublicProfileWorkspaceProps {
  profile: UserProfile;
  items: UserAnime[];
}

type TabFilter = 'all' | WatchStatus;

export function PublicProfileWorkspace({ profile, items }: PublicProfileWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const countNow = items.filter((i) => i.status === 'now').length;
  const countPlan = items.filter((i) => i.status === 'plan').length;
  const countDone = items.filter((i) => i.status === 'done').length;
  const countAll = items.length;

  const filteredItems = activeTab === 'all' ? items : items.filter((i) => i.status === activeTab);

  // Stats calculation
  const totalEpisodes = items.reduce((acc, curr) => {
    if (curr.status === 'done') {
      return acc + (curr.anime?.episodes || curr.progress || 12);
    }
    return acc + (curr.progress || 0);
  }, 0);

  const totalHours = Math.round((totalEpisodes * 24) / 60);

  const ratedItems = items.filter((i) => typeof i.score === 'number' && i.score > 0);
  const avgScore =
    ratedItems.length > 0
      ? ratedItems.reduce((acc, c) => acc + (c.score || 0), 0) / ratedItems.length
      : null;

  const watchedItems = items.filter((i) => i.status === 'now' || i.status === 'done');
  const genreCounts: Record<string, { name: string; count: number }> = {};

  watchedItems.forEach((item) => {
    const genres =
      item.anime?.anime_genres?.map((ag: any) => ag.genres).filter(Boolean) ||
      item.anime?.genres ||
      [];
    genres.forEach((g: any) => {
      if (!genreCounts[g.slug]) {
        genreCounts[g.slug] = { name: g.name_ru, count: 0 };
      }
      genreCounts[g.slug].count += 1;
    });
  });

  const sortedGenres = Object.values(genreCounts).sort((a, b) => b.count - a.count);
  const totalGenreMentions = sortedGenres.reduce((acc, g) => acc + g.count, 0);
  const topGenre = sortedGenres[0];
  const topGenrePercent =
    totalGenreMentions > 0 && topGenre
      ? Math.round((topGenre.count / totalGenreMentions) * 100)
      : 0;

  const topAnime = [...watchedItems].sort((a, b) => {
    const scoreA = a.score || a.anime?.score || 0;
    const scoreB = b.score || b.anime?.score || 0;
    return scoreB - scoreA;
  });

  const formattedJoinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Ambient background */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-lg pb-space-xl">
          {/* Profile Header Card */}
          <div className="relative rounded-3xl bg-surface-container-low p-space-lg md:p-space-xl shadow-xl overflow-hidden border border-outline-variant/30">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-low/70 to-surface-container-lowest pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
              {/* User Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-lg">
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-primary via-secondary to-primary-container blur-md opacity-80" />
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-surface-container-highest shadow-2xl border-2 border-secondary/50 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        fill
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-5xl">
                        person
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-primary font-badge-score text-badge-score shadow-md border border-primary/30">
                    ★ {countDone}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                      {profile.username}
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-label-sm text-label-sm tracking-wide uppercase border border-primary/20">
                      {profile.role === 'admin'
                        ? 'Администратор'
                        : profile.role === 'editor'
                        ? 'Редактор'
                        : 'Киномастер'}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-outline flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      calendar_today
                    </span>
                    В клубе с {formattedJoinDate || 'недавнего времени'} • Публичный список
                  </p>

                  {/* Metrics */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface shadow-sm border border-outline-variant/20">
                      <span
                        className="material-symbols-outlined text-[18px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        movie_filter
                      </span>
                      <span className="font-label-md text-label-md font-semibold">{totalEpisodes}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">эпизодов</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface shadow-sm border border-outline-variant/20">
                      <span
                        className="material-symbols-outlined text-[18px] text-secondary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        auto_stories
                      </span>
                      <span className="font-label-md text-label-md font-semibold">{countAll}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">в списке</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface shadow-sm border border-outline-variant/20">
                      <span
                        className="material-symbols-outlined text-[18px] text-tertiary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-label-md text-label-md font-semibold">
                        {avgScore ? avgScore.toFixed(1) : '—'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">ср. оценка</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions: Share profile */}
              <div className="flex items-center gap-3 pt-2 lg:pt-0">
                <ShareButton
                  title={`Профиль @${profile.username} на Анимо`}
                  description={`Аниме-список и статистика пользователя ${profile.username}: ${countDone} просмотрено, ${totalEpisodes} серий.`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop w-full space-y-space-xl">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-space-md p-space-sm rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Все</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest font-badge-score text-badge-score">
                {countAll}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('now')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md transition-all flex items-center gap-2 ${
                activeTab === 'now'
                  ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Смотрит</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest font-badge-score text-badge-score">
                {countNow}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md transition-all flex items-center gap-2 ${
                activeTab === 'plan'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>В планах</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest font-badge-score text-badge-score">
                {countPlan}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('done')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md transition-all flex items-center gap-2 ${
                activeTab === 'done'
                  ? 'bg-surface-container-highest text-on-surface font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Просмотрено</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest font-badge-score text-badge-score">
                {countDone}
              </span>
            </button>
          </div>

          <Link
            href="/catalog"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-primary hover:bg-surface-container font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            <span>Смотреть каталог</span>
          </Link>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* Left Column: StoryCard & Genres */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            <StoryCard
              profile={profile}
              stats={{
                totalEpisodes,
                totalHours,
                topGenreName: topGenre?.name || '—',
                topGenrePercent,
                avgScore,
              }}
              topAnime={topAnime}
            />

            {/* Favorite Genres */}
            <div className="p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md flex flex-col gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">donut_small</span>
                Любимые жанры
              </span>
              <div className="space-y-3 pt-2">
                {sortedGenres.slice(0, 5).map((genre) => {
                  const percent = totalGenreMentions > 0 ? Math.round((genre.count / totalGenreMentions) * 100) : 0;
                  return (
                    <div key={genre.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-on-surface font-medium">
                        <span>{genre.name}</span>
                        <span className="text-outline">{genre.count} тайтлов ({percent}%)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <span className="material-symbols-outlined text-5xl text-outline mb-2">
                  folder_open
                </span>
                <p className="font-headline-sm text-on-surface font-medium">В этой вкладке пусто</p>
                <p className="font-body-md text-outline mt-1 text-sm">
                  У пользователя пока нет аниме в этом статусе.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const anime = item.anime;
                  if (!anime) return null;
                  const displayTitle = getDisplayTitle(anime);
                  const secondaryTitle = getSecondaryTitle(anime);

                  return (
                    <Link
                      key={item.id || item.anime_id}
                      href={`/anime/${anime.slug || anime.id}`}
                      className="group flex gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-outline-variant/50 transition-all shadow-sm"
                    >
                      <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-surface-container-high shrink-0 shadow">
                        {anime.poster_url ? (
                          <Image
                            src={anime.poster_url}
                            alt={displayTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="64px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline">
                            <span className="material-symbols-outlined text-2xl">movie</span>
                          </div>
                        )}
                        {typeof item.score === 'number' && item.score > 0 && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-bold text-[10px] flex items-center gap-0.5">
                            ★ {item.score}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="font-title-card text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                            {displayTitle}
                          </h4>
                          {secondaryTitle && (
                            <p className="font-body-sm text-[11px] text-outline truncate">
                              {secondaryTitle}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-outline mt-2">
                          <span>
                            {item.status === 'done'
                              ? 'Просмотрено целиком'
                              : `${item.progress} / ${anime.episodes || '?'} сер.`}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px]">
                            {item.status === 'now' ? 'Смотрит' : item.status === 'plan' ? 'В планах' : 'Завершено'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
