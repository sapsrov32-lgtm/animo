'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserProfile, UserAnime, WatchStatus } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import { StoryCard } from './StoryCard';
import { setAnimeProgress, setAnimeWatchStatus } from '@/app/actions/tracker';
import { createClient } from '@/lib/supabase/client';
import { ImportAnimeModal } from './ImportAnimeModal';

interface ProfileWorkspaceProps {
  profile: UserProfile | null;
  initialItems: UserAnime[];
}

type TabFilter = 'all' | WatchStatus;

export function ProfileWorkspace({ profile, initialItems }: ProfileWorkspaceProps) {
  const router = useRouter();
  const [items, setItems] = useState<UserAnime[]>(initialItems);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Group counts
  const countNow = items.filter((i) => i.status === 'now').length;
  const countPlan = items.filter((i) => i.status === 'plan').length;
  const countDone = items.filter((i) => i.status === 'done').length;
  const countAll = items.length;

  // Filtered list
  const filteredItems = activeTab === 'all' ? items : items.filter((i) => i.status === activeTab);

  // Computed stats:
  // 1. Total episodes watched (sum of progress for 'now' and episodes for 'done')
  const totalEpisodes = items.reduce((acc, curr) => {
    if (curr.status === 'done') {
      return acc + (curr.anime?.episodes || curr.progress || 12);
    }
    return acc + (curr.progress || 0);
  }, 0);

  const totalHours = Math.round((totalEpisodes * 24) / 60);

  // 2. Average score among rated titles
  const ratedItems = items.filter((i) => typeof i.score === 'number' && i.score > 0);
  const avgScore =
    ratedItems.length > 0
      ? ratedItems.reduce((acc, c) => acc + (c.score || 0), 0) / ratedItems.length
      : null;

  // 3. Favorite genres computed by titles in 'now' and 'done'
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

  // 4. Top 5 anime for StoryCard (sorted by user's personal score desc, then anime score)
  const topAnime = [...watchedItems].sort((a, b) => {
    const scoreA = a.score || a.anime?.score || 0;
    const scoreB = b.score || b.anime?.score || 0;
    return scoreB - scoreA;
  });

  // Handlers
  const handleProgressChange = async (animeId: string, currentProgress: number, delta: number, maxEpisodes: number | null | undefined) => {
    if (!profile) {
      router.push('/login?redirect=/profile');
      return;
    }
    const max = maxEpisodes || 999;
    const nextProgress = Math.max(0, Math.min(max, currentProgress + delta));

    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.anime_id === animeId ? { ...i, progress: nextProgress } : i))
    );

    await setAnimeProgress(animeId, nextProgress);
  };

  const handleStatusChange = async (animeId: string, newStatus: WatchStatus | null) => {
    if (!profile) {
      router.push('/login?redirect=/profile');
      return;
    }
    const prev = items;
    if (newStatus === null) {
      setItems((prev) => prev.filter((i) => i.anime_id !== animeId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.anime_id === animeId ? { ...i, status: newStatus } : i))
      );
    }

    const res = await setAnimeWatchStatus(animeId, newStatus);
    if (res?.error) {
      setItems(prev);
    }
  };

  const publicProfileUrl = profile?.username
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://animo-virid.vercel.app'}/u/${encodeURIComponent(profile.username)}`
    : '';

  const handleShare = async () => {
    const url = publicProfileUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const title = `Мой профиль и списки аниме @${profile?.username || ''} на Анимо`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: `Смотри мои списки аниме и оценки на сайте Анимо!`,
          url,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleImportSuccess = () => {
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const formattedJoinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Ambient Background Aura */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-lg pb-space-xl">
          {!profile ? (
            /* Guest Header Hero Card */
            <div className="relative rounded-3xl bg-surface-container-low p-8 md:p-12 shadow-xl overflow-hidden border border-outline-variant/30 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-3xl">account_circle</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Личный кабинет и трекер аниме
              </h1>
              <p className="font-body-md text-on-surface-variant max-w-md">
                Войдите в аккаунт, чтобы сохранять прогресс серий, составлять персональные списки и сформировать персональные итоги года.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md min-h-[44px] flex items-center justify-center"
                >
                  Войти
                </Link>
                <Link
                  href="/login?tab=signup"
                  className="px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md font-semibold border border-outline-variant/30 hover:bg-surface-bright active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
                >
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          ) : (
            /* Profile Header Hero Card */
            <div className="relative rounded-3xl bg-surface-container-low p-space-lg md:p-space-xl shadow-xl overflow-hidden border border-outline-variant/30">
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-low/70 to-surface-container-lowest pointer-events-none" />
              <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
                {/* Left: User Identity */}
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
                        {profile.username || 'Пользователь Анимо'}
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
                      Участник клуба с {formattedJoinDate || 'недавнего времени'} • Персональный трекер
                    </p>

                    {/* Public Profile Link Pill */}
                    {profile.username && (
                      <div className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-xl bg-surface-container/60 border border-outline-variant/20 max-w-fit">
                        <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                        <span className="font-body-sm text-xs text-outline">Публичный профиль:</span>
                        <Link
                          href={`/u/${encodeURIComponent(profile.username)}`}
                          target="_blank"
                          className="font-label-sm text-xs font-semibold text-primary hover:underline"
                        >
                          /u/{profile.username}
                        </Link>
                        <button
                          type="button"
                          onClick={handleShare}
                          className="text-outline hover:text-on-surface ml-1 p-0.5 rounded transition-colors"
                          title="Скопировать ссылку на профиль"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {copyFeedback ? 'done' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Quick Metric Strip */}
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

                {/* Right: Actions Profile */}
                <div className="flex flex-wrap items-center gap-space-sm pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copyFeedback ? 'done' : 'share'}
                    </span>
                    <span>{copyFeedback ? 'Ссылка скопирована!' : 'Поделиться'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-highest text-error hover:bg-surface-bright active:scale-95 transition-all shadow-sm font-label-md text-label-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop w-full space-y-space-xl">
        {/* Status Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-sm rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
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
              <span>Смотрю</span>
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

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-label-md text-label-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              <span>Импорт списков</span>
            </button>

            <Link
              href="/catalog"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-primary hover:bg-surface-container font-label-md text-label-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Добавить из каталога</span>
            </Link>
          </div>
        </div>

        {/* Two-Column Grid: Left (Story Card & Detailed Stats) & Right (Anime List) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          
          {/* Left Column: 9:16 Story Card & Stats Bento */}
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

            {/* Favorite Genres Bento Widget */}
            <div className="p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">donut_small</span>
                  Любимые жанры
                </span>
                <span className="font-body-sm text-[12px] text-outline">
                  по «Смотрю» и «Готово»
                </span>
              </div>

              {sortedGenres.length === 0 ? (
                <p className="font-body-sm text-outline py-2">
                  Добавьте тайтлы в «Смотрю» или «Просмотрено», чтобы увидеть распределение по жанрам.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5 pt-2">
                  {sortedGenres.slice(0, 5).map((g) => {
                    const percent = Math.round((g.count / totalGenreMentions) * 100);
                    return (
                      <div key={g.name} className="flex flex-col gap-1">
                        <div className="flex justify-between font-label-md text-label-md">
                          <span className="text-on-surface">{g.name}</span>
                          <span className="text-outline">{g.count} тайтлов ({percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: User Anime Collection List */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {activeTab === 'all'
                  ? 'Все тайтлы коллекции'
                  : activeTab === 'now'
                  ? 'Сейчас смотрю'
                  : activeTab === 'plan'
                  ? 'В планах на просмотр'
                  : 'Завершенные просмотры'}
              </h2>
              <span className="font-body-sm text-body-sm text-outline">
                {filteredItems.length} тайтлов
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-12 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-3xl">bookmark_border</span>
                </div>
                <h3 className="font-title-card text-title-card font-bold text-on-surface">
                  Пока пусто, добавь первый тайтл
                </h3>
                <p className="font-body-sm text-body-sm text-outline max-w-sm">
                  Перейдите в каталог и добавьте интересующие тайтлы в личный список просмотра.
                </p>
                <Link
                  href="/catalog"
                  className="mt-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 transition-all shadow-md"
                >
                  Открыть каталог
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredItems.map((item) => {
                  const anime = item.anime;
                  if (!anime) return null;
                  const displayTitle = getDisplayTitle(anime);
                  const secondaryTitle = getSecondaryTitle(anime);

                  return (
                    <div
                      key={item.anime_id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/40 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <Link
                          href={`/anime/${anime.slug || anime.id}`}
                          className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-surface-container shrink-0 shadow"
                        >
                          {anime.poster_url ? (
                            <Image
                              src={anime.poster_url}
                              alt={displayTitle}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-2xl">movie</span>
                            </div>
                          )}
                        </Link>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md font-label-sm text-[10px] uppercase font-bold ${
                                item.status === 'now'
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : item.status === 'plan'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'bg-surface-container-highest text-on-surface'
                              }`}
                            >
                              {item.status === 'now'
                                ? 'Смотрю'
                                : item.status === 'plan'
                                ? 'В планах'
                                : 'Просмотрено'}
                            </span>
                            {item.score && (
                              <span className="flex items-center gap-0.5 text-secondary font-badge-score text-badge-score">
                                <span
                                  className="material-symbols-outlined text-[13px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                {item.score}
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/anime/${anime.slug || anime.id}`}
                            className="font-title-card text-title-card font-bold text-on-surface hover:text-primary transition-colors line-clamp-1"
                          >
                            {displayTitle}
                          </Link>

                          <span className="font-body-sm text-[12px] text-outline truncate">
                            {secondaryTitle || anime.format || `${anime.year || '—'} г.`}
                          </span>

                          {/* Progress Stepper for 'now' */}
                          {item.status === 'now' && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-body-sm text-[12px] text-on-surface-variant font-medium">
                                Серия {item.progress} из {anime.episodes || '?'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleProgressChange(item.anime_id, item.progress, 1, anime.episodes)
                                }
                                className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                              >
                                <span>+1 серия</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Status Switcher & Remove */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {item.status !== 'now' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.anime_id, 'now')}
                            className="p-2 rounded-xl bg-surface-container hover:bg-secondary-container hover:text-on-secondary-container text-outline transition-colors"
                            title="Переместить в «Смотрю»"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          </button>
                        )}

                        {item.status !== 'done' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.anime_id, 'done')}
                            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-highest hover:text-on-surface text-outline transition-colors"
                            title="Переместить в «Просмотрено»"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.anime_id, null)}
                          className="p-2 rounded-xl bg-surface-container hover:bg-error-container/30 hover:text-error text-outline transition-colors"
                          title="Удалить из коллекции"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <ImportAnimeModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
