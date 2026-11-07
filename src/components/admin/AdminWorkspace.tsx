'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Anime, Genre, AnimeStatus } from '@/types';
import { getDisplayTitle, getSecondaryTitle } from '@/lib/format';
import {
  upsertAnimeAction,
  toggleAnimePublishAction,
  deleteAnimeAction,
  AnimeInputData,
} from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';

interface AdminWorkspaceProps {
  initialAnimeList: Anime[];
  allGenres: Genre[];
}

export function AdminWorkspace({ initialAnimeList, allGenres }: AdminWorkspaceProps) {
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnimeList);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleJp, setTitleJp] = useState('');
  const [slug, setSlug] = useState('');
  const [format, setFormat] = useState('ТВ Сериал');
  const [episodes, setEpisodes] = useState<string>('');
  const [status, setStatus] = useState<AnimeStatus>('ongoing');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [season, setSeason] = useState('');
  const [studio, setStudio] = useState('');
  const [score, setScore] = useState<string>('');
  const [airingDay, setAiringDay] = useState('');
  const [nextEpisodeAt, setNextEpisodeAt] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'finished' | 'drafts'>('all');

  // Stats calculation
  const totalCount = animeList.length;
  const ongoingCount = animeList.filter((a) => a.status === 'ongoing').length;
  const finishedCount = animeList.filter((a) => a.status === 'finished').length;
  const publishedCount = animeList.filter((a) => a.is_published).length;
  const draftCount = totalCount - publishedCount;

  // Filtered table rows
  const filteredList = useMemo(() => {
    return animeList.filter((item) => {
      // Status tab
      if (statusFilter === 'ongoing' && item.status !== 'ongoing') return false;
      if (statusFilter === 'finished' && item.status !== 'finished') return false;
      if (statusFilter === 'drafts' && item.is_published) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tRu = item.title_ru?.toLowerCase() || '';
        const tEn = item.title_en?.toLowerCase() || '';
        const s = item.slug.toLowerCase();
        const std = item.studio?.toLowerCase() || '';
        return tRu.includes(q) || tEn.includes(q) || s.includes(q) || std.includes(q);
      }

      return true;
    });
  }, [animeList, statusFilter, searchQuery]);

  // Load anime into form for editing
  const handleEditAnime = (anime: Anime) => {
    setEditingId(anime.id);
    setTitleRu(anime.title_ru || '');
    setTitleEn(anime.title_en || '');
    setTitleJp(anime.title_jp || '');
    setSlug(anime.slug);
    setFormat(anime.format || 'ТВ Сериал');
    setEpisodes(anime.episodes ? anime.episodes.toString() : '');
    setStatus(anime.status);
    setYear(anime.year ? anime.year.toString() : '');
    setSeason(anime.season || '');
    setStudio(anime.studio || '');
    setScore(anime.score ? anime.score.toString() : '');
    setAiringDay(anime.airing_day || '');
    setNextEpisodeAt(anime.next_episode_at ? anime.next_episode_at.slice(0, 16) : '');
    setDescription(anime.description || '');
    setPosterUrl(anime.poster_url || '');
    setBannerUrl(anime.banner_url || '');
    setIsPublished(anime.is_published ?? true);

    const currentGenres =
      anime.anime_genres?.map((ag: any) => ag.genres?.id).filter(Boolean) ||
      anime.genres?.map((g) => g.id) ||
      [];
    setSelectedGenreIds(currentGenres);

    setFormMessage(null);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleClearForm = () => {
    setEditingId(null);
    setTitleRu('');
    setTitleEn('');
    setTitleJp('');
    setSlug('');
    setFormat('ТВ Сериал');
    setEpisodes('');
    setStatus('ongoing');
    setYear(new Date().getFullYear().toString());
    setSeason('');
    setStudio('');
    setScore('');
    setAiringDay('');
    setNextEpisodeAt('');
    setDescription('');
    setPosterUrl('');
    setBannerUrl('');
    setIsPublished(true);
    setSelectedGenreIds([]);
    setFormMessage(null);
  };

  // Upload image to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('posters')
        .upload(`uploads/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        setFormMessage({ type: 'error', text: `Ошибка загрузки файла: ${error.message}` });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(data.path);

      setPosterUrl(publicUrlData.publicUrl);
      setFormMessage({ type: 'success', text: 'Постер успешно загружен в хранилище!' });
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err?.message || 'Ошибка загрузки' });
    } finally {
      setIsUploading(false);
    }
  };

  // Save anime
  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleRu.trim() && !titleEn.trim()) {
      setFormMessage({ type: 'error', text: 'Укажите хотя бы одно название тайтла (RU или EN)' });
      return;
    }

    setIsSaving(true);
    setFormMessage(null);

    const payload: AnimeInputData = {
      ...(editingId ? { id: editingId } : {}),
      slug: slug.trim() || undefined,
      title_ru: titleRu.trim() || null,
      title_en: titleEn.trim() || null,
      title_jp: titleJp.trim() || null,
      description: description.trim() || null,
      year: year ? parseInt(year, 10) : null,
      season: season.trim() || null,
      status,
      format: format.trim() || 'ТВ Сериал',
      episodes: episodes ? parseInt(episodes, 10) : null,
      poster_url: posterUrl.trim() || null,
      banner_url: bannerUrl.trim() || null,
      airing_day: airingDay.trim() || null,
      next_episode_at: nextEpisodeAt ? new Date(nextEpisodeAt).toISOString() : null,
      score: score ? parseFloat(score) : null,
      studio: studio.trim() || null,
      is_published: isPublished,
      genre_ids: selectedGenreIds,
    };

    try {
      const res = await upsertAnimeAction(payload);
      if (res?.error) {
        setFormMessage({ type: 'error', text: res.error });
        return;
      }

      if (res?.anime) {
        setFormMessage({
          type: 'success',
          text: editingId ? 'Тайтл успешно обновлён!' : 'Новый тайтл успешно добавлен в базу!',
        });

        // Update local list
        setAnimeList((prev) => {
          if (editingId) {
            return prev.map((item) => (item.id === editingId ? { ...item, ...res.anime } : item));
          }
          return [res.anime, ...prev];
        });

        if (!editingId) {
          handleClearForm();
        }
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err?.message || 'Ошибка сохранения' });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publication switch in table
  const handleTogglePublish = async (anime: Anime) => {
    const nextState = !anime.is_published;
    setAnimeList((prev) =>
      prev.map((item) => (item.id === anime.id ? { ...item, is_published: nextState } : item))
    );

    const res = await toggleAnimePublishAction(anime.id, nextState);
    if (res?.error) {
      setAnimeList((prev) =>
        prev.map((item) => (item.id === anime.id ? { ...item, is_published: !nextState } : item))
      );
    }
  };

  // Delete anime
  const handleDeleteAnime = async (anime: Anime) => {
    const confirmName = prompt(
      `Вы уверены, что хотите удалить тайтл «${getDisplayTitle(anime)}»?\nВведите «УДАЛИТЬ» для подтверждения:`
    );
    if (confirmName !== 'УДАЛИТЬ') {
      return;
    }

    const prevList = animeList;
    setAnimeList((prev) => prev.filter((i) => i.id !== anime.id));

    const res = await deleteAnimeAction(anime.id);
    if (res?.error) {
      alert(`Ошибка удаления: ${res.error}`);
      setAnimeList(prevList);
    } else if (editingId === anime.id) {
      handleClearForm();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Slug',
      'Title RU',
      'Title EN',
      'Status',
      'Format',
      'Episodes',
      'Year',
      'Score',
      'Studio',
      'Is Published',
    ];

    const rows = animeList.map((a) => [
      `"${a.id}"`,
      `"${a.slug}"`,
      `"${(a.title_ru || '').replace(/"/g, '""')}"`,
      `"${(a.title_en || '').replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.format || ''}"`,
      `"${a.episodes || ''}"`,
      `"${a.year || ''}"`,
      `"${a.score || ''}"`,
      `"${(a.studio || '').replace(/"/g, '""')}"`,
      `"${a.is_published ? 'Да' : 'Нет'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `animo-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="relative w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg flex flex-col gap-space-xl overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute -top-32 right-12 w-96 h-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-secondary-container/20 blur-[120px] pointer-events-none -z-10" />

        {/* Page Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm">
              <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">Админ-панель</span>
            </div>

            <div className="flex items-baseline gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Управление каталогом тайтлов
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm border border-secondary/30">
                v2.14.8 Database API
              </span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Консоль централизованного редактирования метаданных, расписания онгоингов, управления публикацией и постерами в Supabase Storage.
            </p>
          </div>

          <div className="flex items-center gap-space-sm shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 hover:brightness-110 shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Экспорт CSV</span>
            </button>
          </div>
        </section>

        {/* 4 Stats Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                Всего тайтлов
              </span>
              <span className="p-2 rounded-xl bg-surface-container text-primary">
                <span className="material-symbols-outlined text-[20px]">movie_filter</span>
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {totalCount}
              </div>
              <div className="flex items-center gap-1.5 text-primary font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[16px]">database</span>
                <span>В базе данных Supabase</span>
              </div>
            </div>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                Активных онгоингов
              </span>
              <span className="p-2 rounded-xl bg-surface-container text-tertiary">
                <span className="material-symbols-outlined text-[20px]">live_tv</span>
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {ongoingCount}
              </div>
              <div className="flex items-center gap-1.5 text-tertiary font-body-sm text-body-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span>Транслируются прямо сейчас</span>
              </div>
            </div>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                Завершённые тайтлы
              </span>
              <span className="p-2 rounded-xl bg-surface-container text-secondary">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {finishedCount}
              </div>
              <div className="flex items-center gap-1.5 text-secondary font-body-sm text-body-sm">
                <span>Полные сезоны и фильмы</span>
              </div>
            </div>
          </div>

          <div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                Публикация
              </span>
              <span className="p-2 rounded-xl bg-surface-container text-outline">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {publishedCount}
              </div>
              <div className="flex items-center gap-1.5 text-outline font-body-sm text-body-sm">
                <span>Опубликовано (черновиков: {draftCount})</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          
          {/* FORM COLUMN (Add / Edit Anime) */}
          <section className="lg:col-span-5 bg-surface-container-low rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {editingId ? 'edit_square' : 'add_circle'}
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {editingId ? 'Редактировать тайтл' : 'Добавить новый тайтл'}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-outline hover:text-on-surface text-label-sm font-label-sm transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>

            {formMessage && (
              <div
                className={`p-3 rounded-xl font-body-sm text-body-sm flex items-start gap-2 animate-fadeIn ${
                  formMessage.type === 'success'
                    ? 'bg-primary-container/20 text-primary border border-primary/30'
                    : 'bg-error-container/20 text-error border border-error/30'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  {formMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{formMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAnime} className="flex flex-col gap-space-md">
              {/* Poster Drop & Upload Zone */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Постер тайтла (2:3)
                </label>
                <div className="relative rounded-2xl bg-surface-container p-4 flex flex-col sm:flex-row items-center gap-4 transition-all hover:bg-surface-container-high border border-outline-variant/20">
                  <div className="w-24 h-36 rounded-xl bg-surface-container-highest overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt="Превью"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-3xl">image</span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-2 text-center sm:text-left flex-1 min-w-0">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Загрузка в Supabase Storage
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-primary font-label-sm text-label-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">folder_open</span>
                        <span>{isUploading ? 'Загрузка...' : 'Выбрать файл'}</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      placeholder="Или вставьте URL постера..."
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-[12px] border border-outline-variant/30 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Titles RU & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Название (RU)
                  </label>
                  <input
                    type="text"
                    value={titleRu}
                    onChange={(e) => setTitleRu(e.target.value)}
                    placeholder="Атака титанов"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline/60 font-body-md text-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Название (EN / Romaji)
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Attack on Titan"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline/60 font-body-md text-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Slug & Title JP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Слаг (URL)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="attack-on-titan"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline/60 font-body-md text-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Название (JP)
                  </label>
                  <input
                    type="text"
                    value={titleJp}
                    onChange={(e) => setTitleJp(e.target.value)}
                    placeholder="進撃の巨人"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline/60 font-body-md text-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Format, Episodes, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Формат
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  >
                    <option value="ТВ Сериал">ТВ Сериал</option>
                    <option value="Фильм">Фильм</option>
                    <option value="OVA">OVA</option>
                    <option value="ONA">ONA</option>
                    <option value="Спэшл">Спэшл</option>
                    <option value="Клип">Клип</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Серий
                  </label>
                  <input
                    type="number"
                    value={episodes}
                    onChange={(e) => setEpisodes(e.target.value)}
                    placeholder="12"
                    min="1"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Статус
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AnimeStatus)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  >
                    <option value="ongoing">В эфире</option>
                    <option value="finished">Завершён</option>
                    <option value="announced">Анонс</option>
                  </select>
                </div>
              </div>

              {/* Year, Studio, Score */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Год
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Студия
                  </label>
                  <input
                    type="text"
                    value={studio}
                    onChange={(e) => setStudio(e.target.value)}
                    placeholder="MAPPA"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Рейтинг (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="8.9"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Airing Schedule (for ongoing) */}
              {status === 'ongoing' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-container rounded-xl border border-tertiary/20">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-tertiary uppercase font-semibold">
                      День эфира
                    </label>
                    <select
                      value={airingDay}
                      onChange={(e) => setAiringDay(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm"
                    >
                      <option value="">Не указан</option>
                      <option value="пн">Понедельник (пн)</option>
                      <option value="вт">Вторник (вт)</option>
                      <option value="ср">Среда (ср)</option>
                      <option value="чт">Четверг (чт)</option>
                      <option value="пт">Пятница (пт)</option>
                      <option value="сб">Суббота (сб)</option>
                      <option value="вс">Воскресенье (вс)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-tertiary uppercase font-semibold">
                      Следующая серия (Дата/Время)
                    </label>
                    <input
                      type="datetime-local"
                      value={nextEpisodeAt}
                      onChange={(e) => setNextEpisodeAt(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm"
                    />
                  </div>
                </div>
              )}

              {/* Genres Multi-select Chips */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Жанры ({selectedGenreIds.length} выбрано)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                  {allGenres.map((g) => {
                    const isSelected = selectedGenreIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGenreIds((prev) =>
                            isSelected ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg font-label-sm text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {g.name_ru}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Описание / Синопсис
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Синопсис сюжета..."
                  className="w-full p-3.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline/60 font-body-sm text-body-sm border border-outline-variant/20 focus:border-primary focus:outline-none resize-y"
                />
              </div>

              {/* Publication Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Опубликовать в каталоге
                  </span>
                  <span className="font-body-sm text-[11px] text-outline">
                    Тайтл станет виден посетителям сайта
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSaving ? 'sync' : 'save'}
                  </span>
                  <span>{isSaving ? 'Сохранение...' : editingId ? 'Обновить тайтл' : 'Создать тайтл'}</span>
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="h-12 px-5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* TABLE / LIST COLUMN */}
          <section className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Filter Bar */}
            <div className="p-space-md rounded-2xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm border border-outline-variant/20">
              <div className="relative flex-1">
                <span className="material-symbols-outlined text-outline absolute left-3.5 top-2.5 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или слагу..."
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/20"
                />
              </div>

              <div className="flex bg-surface-container p-1 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all ${
                    statusFilter === 'all'
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Все ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ongoing')}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all ${
                    statusFilter === 'ongoing'
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Онгоинги ({ongoingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('finished')}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all ${
                    statusFilter === 'finished'
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Завершены ({finishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('drafts')}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all ${
                    statusFilter === 'drafts'
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Скрытые ({draftCount})
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="rounded-2xl bg-surface-container-low shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
              <div className="px-space-lg py-space-md flex items-center justify-between border-b border-surface-container-highest">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">dataset</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    База тайтлов
                  </h3>
                </div>
                <span className="text-outline font-label-sm text-label-sm">
                  Показано {filteredList.length} из {totalCount}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="sticky top-0 z-10 bg-surface-container-lowest text-outline font-label-sm text-label-sm uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Тайтл</th>
                      <th className="py-3 px-3">Формат</th>
                      <th className="py-3 px-3">Рейтинг</th>
                      <th className="py-3 px-3">Статус</th>
                      <th className="py-3 px-3">Опубликован</th>
                      <th className="py-3 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-outline">
                          Тайтлы по данному фильтру не найдены.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((anime) => {
                        const displayTitle = getDisplayTitle(anime);
                        const secondaryTitle = getSecondaryTitle(anime);

                        return (
                          <tr
                            key={anime.id}
                            className={`hover:bg-surface-container/60 transition-colors group ${
                              editingId === anime.id ? 'bg-primary-container/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-container-high relative">
                                  {anime.poster_url ? (
                                    <Image
                                      src={anime.poster_url}
                                      alt={displayTitle}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-outline">
                                      <span className="material-symbols-outlined text-[16px]">movie</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 max-w-[200px]">
                                  <span className="font-title-card text-title-card text-on-surface truncate group-hover:text-primary transition-colors font-semibold">
                                    {displayTitle}
                                  </span>
                                  <span className="font-body-sm text-[11px] text-outline truncate">
                                    {secondaryTitle || anime.slug}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                                {anime.format || 'ТВ'} {anime.episodes ? `(${anime.episodes})` : ''}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {anime.score ? (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-badge-score text-badge-score">
                                  <span
                                    className="material-symbols-outlined text-[13px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    star
                                  </span>
                                  <span>{anime.score.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-outline text-[12px]">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1.5 font-label-sm text-label-sm ${
                                  anime.status === 'ongoing' ? 'text-tertiary' : 'text-outline'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    anime.status === 'ongoing' ? 'bg-tertiary animate-pulse' : 'bg-outline'
                                  }`}
                                />
                                <span>{anime.status === 'ongoing' ? 'В эфире' : 'Завершён'}</span>
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(anime)}
                                className={`px-2.5 py-1 rounded-full font-label-sm text-[11px] font-bold transition-all ${
                                  anime.is_published
                                    ? 'bg-primary-container text-on-primary-container hover:brightness-110'
                                    : 'bg-surface-container-highest text-outline hover:text-on-surface'
                                }`}
                                title="Нажмите для переключения видимости в каталоге"
                              >
                                {anime.is_published ? 'Да' : 'Скрыт'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Link
                                  href={`/anime/${anime.slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                                  title="Открыть карточку тайтла"
                                >
                                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleEditAnime(anime)}
                                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors"
                                  title="Редактировать тайтл"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnime(anime)}
                                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-error transition-colors"
                                  title="Удалить тайтл"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
