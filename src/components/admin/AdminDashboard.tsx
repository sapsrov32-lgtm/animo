'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  LayoutDashboard,
  Film,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  ShieldAlert,
  Search,
  Bell,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminCatalog,
  fetchAdminUsers,
  updateUserRole,
  fetchSiteSettings,
  saveSiteSettings,
} from '@/app/actions/admin-dashboard';
import { upsertAnimeAction, toggleAnimePublishAction, deleteAnimeAction } from '@/app/actions/admin';
import { getDisplayTitle } from '@/lib/format';

interface AdminDashboardProps {
  initialData: any;
  allGenres: any[];
}

export function AdminDashboard({ initialData, allGenres }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'catalog' | 'users' | 'calendar' | 'settings' | 'audit'
  >('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Catalog state
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogItems, setCatalogItems] = useState<any[]>(initialData.topAnime || []);
  const [catalogTotal, setCatalogTotal] = useState(initialData.metrics.totalAnime);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatus, setCatalogStatus] = useState('all');
  const [catalogFormat, setCatalogFormat] = useState('all');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editingAnime, setEditingAnime] = useState<any | null>(null);
  const [savingAnime, setSavingAnime] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<any[]>(initialData.recentUsers || []);
  const [usersLoading, setUsersLoading] = useState(false);

  // Settings state
  const [siteSettings, setSiteSettings] = useState<any>({
    title: 'Анимо — каталог аниме и трекер серий',
    description: 'Полная база данных на 38 000+ аниме, трекер серий и календарь релизов.',
    allowRegistrations: true,
    maintenanceMode: false,
  });

  // Calculate greeting
  const [greeting, setGreeting] = useState('Добрый день');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('Доброй ночи');
    else if (hour < 12) setGreeting('Доброе утро');
    else if (hour < 18) setGreeting('Добрый день');
    else setGreeting('Добрый вечер');

    // Load initial settings
    fetchSiteSettings().then((s) => {
      if (s && Object.keys(s).length > 0) {
        setSiteSettings((prev: any) => ({ ...prev, ...s }));
      }
    });
  }, []);

  // Fetch catalog when filters change
  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetchAdminCatalog({
        page: catalogPage,
        perPage: 15,
        search: catalogSearch,
        status: catalogStatus,
        format: catalogFormat,
      });
      setCatalogItems(res.items);
      setCatalogTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      loadCatalog();
    }
  }, [activeTab, catalogPage, catalogStatus, catalogFormat]);

  const handleCatalogSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCatalogPage(1);
    loadCatalog();
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    await toggleAnimePublishAction(id, !current);
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_published: !current } : item))
    );
  };

  const handleDeleteAnime = async (id: string) => {
    if (!confirm('Удалить этот тайтл из базы?')) return;
    await deleteAnimeAction(id);
    setCatalogItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnime) return;
    setSavingAnime(true);
    try {
      await upsertAnimeAction(editingAnime);
      setEditingAnime(null);
      loadCatalog();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAnime(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'editor' | 'user') => {
    await updateUserRole(userId, newRole);
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleSaveSettings = async () => {
    await saveSiteSettings('general', siteSettings);
    alert('Настройки успешно сохранены!');
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#0c0a14] text-slate-100' : 'bg-[#F7F8FC] text-slate-800';
  const cardClass = isDark
    ? 'bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl'
    : 'bg-white border border-slate-200/80 shadow-md rounded-2xl';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300 flex flex-col md:flex-row font-sans`}>
      {/* Background Ambient Glows (Glassmorphism) */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] bg-violet-600/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-pink-600/5 rounded-full blur-[140px]" />
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`w-full md:w-64 shrink-0 z-20 ${isDark ? 'bg-slate-950/70 border-r border-white/10' : 'bg-white border-r border-slate-200'} backdrop-blur-2xl p-5 flex flex-col justify-between`}>
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Анимо
                </span>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400/80 font-bold">
                  Admin Workspace
                </span>
              </div>
            </Link>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition-all`}
              title="Переключить тему"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="flex flex-col gap-6">
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted} px-3 block mb-2`}>
                Главное
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'overview'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Обзор</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10">Live</span>
                </button>
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted} px-3 block mb-2`}>
                Контент
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Film className="w-4 h-4" />
                    <span>Каталог аниме</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10">38k</span>
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'calendar'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <span>Календарь релизов</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10">97</span>
                </button>
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted} px-3 block mb-2`}>
                Люди и Безопасность
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Пользователи</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'audit'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Журнал действий</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted} px-3 block mb-2`}>
                Система
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                      : `${textMuted} hover:text-white hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span>Настройки</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User Card */}
        <div className={`pt-4 mt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md">
              {initialData.currentUser?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs truncate">
                {initialData.currentUser?.username || 'Администратор'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">
                {initialData.currentUser?.role || 'admin'}
              </span>
            </div>
          </div>
          <Link
            href="/"
            className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'} transition-colors`}
            title="Перейти на сайт"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 z-10 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {initialData.currentUser?.username || 'Админ'} 👋
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>
              Панель управления и синхронизации каталога «Анимо». Все системы работают стабильно.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className={`p-1 rounded-xl ${isDark ? 'bg-slate-900/80 border border-white/10' : 'bg-white border border-slate-200'} flex items-center text-xs font-semibold`}>
              {(['7d', '30d', '90d', '1y'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    period === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : `${textMuted} hover:text-white`
                  }`}
                >
                  {p === '7d' ? '7 дн.' : p === '30d' ? '30 дн.' : p === '90d' ? '3 мес.' : '1 год'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveTab('catalog');
                setEditingAnime({
                  title_ru: '',
                  title_en: '',
                  title_jp: '',
                  description: '',
                  year: new Date().getFullYear(),
                  status: 'ongoing',
                  format: 'ТВ Сериал',
                  episodes: null,
                  poster_url: '',
                  is_published: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить тайтл</span>
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={textMuted}>Всего пользователей</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {initialData.metrics.totalUsers}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{initialData.metrics.userDelta} за период</span>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={textMuted}>Тайтлов в каталоге</span>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {initialData.metrics.totalAnime.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Все 18+ исключены</span>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={textMuted}>Активных онгоингов</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {initialData.metrics.totalOngoings}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>С точным расписанием</span>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={textMuted}>Записей в списках</span>
                  <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {initialData.metrics.totalTrackingRows}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-xs text-indigo-400 font-semibold">
                    <span>Честный трекер</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Area Chart */}
              <div className={`lg:col-span-2 ${cardClass} p-6 flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base">Активность пользователей</h3>
                    <p className={`text-xs ${textMuted}`}>Динамика просмотров и обновлений трекера</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                    +18% прирост
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={initialData.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={12} tickLine={false} />
                      <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          borderRadius: '12px',
                          color: isDark ? '#f8fafc' : '#0f172a',
                        }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Donut Chart */}
              <div className={`${cardClass} p-6 flex flex-col justify-between`}>
                <div>
                  <h3 className="font-bold text-base">Статусы в трекере</h3>
                  <p className={`text-xs ${textMuted}`}>Распределение пользовательских списков</p>
                </div>
                <div className="h-48 w-full relative my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={initialData.statusBreakdown}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {initialData.statusBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold">{initialData.metrics.totalTrackingRows}</span>
                    <span className="text-[10px] text-slate-400">Всего в трекере</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                  {initialData.statusBreakdown.map((s: any) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className={textMuted}>{s.name}</span>
                      <span className="font-bold ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Widgets Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Popular Anime */}
              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base">Топ аниме по популярности</h3>
                  <button onClick={() => setActiveTab('catalog')} className="text-xs text-indigo-400 hover:underline">
                    Смотреть все
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {initialData.topAnime.map((a: any, idx: number) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold w-4 text-slate-500">#{idx + 1}</span>
                        {a.poster_url ? (
                          <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                            <Image src={a.poster_url} alt={a.title_en} fill sizes="40px" className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center text-[10px]">
                            No Pic
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs sm:text-sm truncate">
                            {getDisplayTitle(a)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {a.format} • {a.popularity?.toLocaleString()} голосов
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded-md bg-amber-400/10 shrink-0">
                        ★ {a.score || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Quality & Issues Widget */}
              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-base">Качество данных каталога</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 font-bold">
                    Требуют внимания
                  </span>
                </div>
                <p className={`text-xs mb-4 ${textMuted}`}>
                  Тайтлы без постера или без русского описания. Вы можете дополнить их в один клик:
                </p>
                <div className="flex flex-col gap-2.5">
                  {initialData.qualityIssues.slice(0, 5).map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="font-medium text-xs truncate">
                          {q.title_ru || q.title_en}
                        </span>
                        <span className="text-[10px] text-amber-400">
                          {!q.poster_url ? 'Нет постера' : !q.title_ru ? 'Нет рус. названия' : 'Нет описания'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('catalog');
                          setEditingAnime(q);
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-medium transition-colors shrink-0"
                      >
                        Исправить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-6">
            {/* Catalog Controls */}
            <div className={`${cardClass} p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between`}>
              <form onSubmit={handleCatalogSearchSubmit} className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по названию (ru, en, jp)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm ${
                    isDark ? 'bg-slate-800/80 border border-white/10 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </form>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={catalogStatus}
                  onChange={(e) => setCatalogStatus(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium ${
                    isDark ? 'bg-slate-800 border border-white/10 text-white' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  <option value="all">Все статусы</option>
                  <option value="ongoing">Онгоинги</option>
                  <option value="finished">Завершенные</option>
                  <option value="announced">Анонсы</option>
                </select>

                <select
                  value={catalogFormat}
                  onChange={(e) => setCatalogFormat(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium ${
                    isDark ? 'bg-slate-800 border border-white/10 text-white' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  <option value="all">Все форматы</option>
                  <option value="ТВ Сериал">ТВ Сериал</option>
                  <option value="Фильм">Фильм</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                </select>

                <span className={`text-xs ${textMuted}`}>
                  Всего: {catalogTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Catalog Table */}
            <div className={`${cardClass} overflow-x-auto`}>
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className={`border-b ${isDark ? 'border-white/10 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Постер & Название</th>
                    <th className="py-3.5 px-4 font-semibold">Формат</th>
                    <th className="py-3.5 px-4 font-semibold">Статус</th>
                    <th className="py-3.5 px-4 font-semibold">Серии</th>
                    <th className="py-3.5 px-4 font-semibold">Оценка</th>
                    <th className="py-3.5 px-4 font-semibold">Видимость</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {catalogLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Загрузка каталога...
                      </td>
                    </tr>
                  ) : catalogItems.length > 0 ? (
                    catalogItems.map((anime) => (
                      <tr key={anime.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 max-w-sm">
                            {anime.poster_url ? (
                              <div className="relative w-9 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                                <Image src={anime.poster_url} alt={anime.title_en} fill sizes="36px" className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="w-9 h-12 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center text-[10px]">
                                Нет
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs sm:text-sm truncate">
                                {getDisplayTitle(anime)}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {anime.title_en || anime.title_jp}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{anime.format || 'ТВ'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            anime.status === 'ongoing'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : anime.status === 'announced'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-indigo-500/15 text-indigo-400'
                          }`}>
                            {anime.status === 'ongoing' ? 'Онгоинг' : anime.status === 'announced' ? 'Скоро' : 'Завершён'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{anime.episodes ? `${anime.episodes} эп.` : '—'}</td>
                        <td className="py-3 px-4 font-bold text-amber-400">★ {anime.score || '—'}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePublish(anime.id, anime.is_published)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              anime.is_published
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                            }`}
                          >
                            {anime.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{anime.is_published ? 'Опубликован' : 'Скрыт'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingAnime(anime)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              title="Редактировать"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnime(anime.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Ничего не найдено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <button
                  disabled={catalogPage <= 1}
                  onClick={() => setCatalogPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-medium"
                >
                  Назад
                </button>
                <span className="text-xs text-slate-400">
                  Страница {catalogPage} из {Math.ceil(catalogTotal / 15) || 1}
                </span>
                <button
                  disabled={catalogPage >= Math.ceil(catalogTotal / 15)}
                  onClick={() => setCatalogPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-medium"
                >
                  Вперёд
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} p-6`}>
              <h3 className="font-bold text-lg mb-2">Управление пользователями</h3>
              <p className={`text-xs mb-6 ${textMuted}`}>
                Список зарегистрированных пользователей, их роли и права доступа.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Пользователь</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Дата регистрации</th>
                      <th className="py-3 px-4">Роль</th>
                      <th className="py-3 px-4 text-right">Изменить роль</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-semibold flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span>{user.username || 'Без имени'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{user.email || '—'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-400'
                              : user.role === 'editor'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="user">user</option>
                            <option value="editor">editor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} p-6`}>
              <h3 className="font-bold text-lg mb-2">Расписание выхода серий</h3>
              <p className={`text-xs mb-6 ${textMuted}`}>
                Тайтлы с подтверждённой датой следующего эпизода в эфире.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialData.upcomingAiring.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {a.poster_url && (
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0">
                          <Image src={a.poster_url} alt={a.title_en} fill sizes="48px" className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs sm:text-sm truncate">
                          {getDisplayTitle(a)}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold mt-1">
                          {a.next_episode_at ? new Date(a.next_episode_at).toLocaleString('ru-RU') : 'Не объявлена'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} p-6`}>
              <h3 className="font-bold text-lg mb-2">Журнал действий администраторов</h3>
              <p className={`text-xs mb-6 ${textMuted}`}>
                Фиксация всех изменений, публикации и редактирования контента.
              </p>
              <div className="flex flex-col gap-3">
                {initialData.auditLogs.length > 0 ? (
                  initialData.auditLogs.map((log: any) => (
                    <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-400 uppercase">{log.action}</span>
                        <span className="text-slate-300">{log.target_type}: {log.target_id || ''}</span>
                      </div>
                      <span className="text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString('ru-RU') : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">Журнал пуст.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} p-6 max-w-2xl`}>
              <h3 className="font-bold text-lg mb-2">Глобальные настройки сайта</h3>
              <p className={`text-xs mb-6 ${textMuted}`}>
                Управление метаданными, заголовком сайта и переключателями функций.
              </p>
              <div className="flex flex-col gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold mb-1">Название сайта</label>
                  <input
                    type="text"
                    value={siteSettings.title}
                    onChange={(e) => setSiteSettings({ ...siteSettings, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Мета-описание (SEO)</label>
                  <textarea
                    rows={3}
                    value={siteSettings.description}
                    onChange={(e) => setSiteSettings({ ...siteSettings, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editingAnime && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-5 border border-white/20 shadow-2xl`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-lg sm:text-xl">
                  {editingAnime.id ? 'Редактировать тайтл' : 'Создать тайтл'}
                </h3>
                <button
                  onClick={() => setEditingAnime(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAnime} className="flex flex-col gap-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Русское название</label>
                    <input
                      type="text"
                      value={editingAnime.title_ru || ''}
                      onChange={(e) => setEditingAnime({ ...editingAnime, title_ru: e.target.value })}
                      placeholder="Атака титанов"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Английское название</label>
                    <input
                      type="text"
                      value={editingAnime.title_en || ''}
                      onChange={(e) => setEditingAnime({ ...editingAnime, title_en: e.target.value })}
                      placeholder="Attack on Titan"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Формат</label>
                    <select
                      value={editingAnime.format || 'ТВ Сериал'}
                      onChange={(e) => setEditingAnime({ ...editingAnime, format: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                    >
                      <option value="ТВ Сериал">ТВ Сериал</option>
                      <option value="Фильм">Фильм</option>
                      <option value="OVA">OVA</option>
                      <option value="ONA">ONA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Статус</label>
                    <select
                      value={editingAnime.status || 'ongoing'}
                      onChange={(e) => setEditingAnime({ ...editingAnime, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                    >
                      <option value="ongoing">Онгоинг</option>
                      <option value="finished">Завершён</option>
                      <option value="announced">Скоро</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Серии</label>
                    <input
                      type="number"
                      value={editingAnime.episodes || ''}
                      onChange={(e) => setEditingAnime({ ...editingAnime, episodes: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL постера</label>
                  <input
                    type="text"
                    value={editingAnime.poster_url || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, poster_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Описание сюжета</label>
                  <textarea
                    rows={4}
                    value={editingAnime.description || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAnime}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    {savingAnime ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAnime(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
