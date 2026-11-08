'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
  Download,
  Filter,
  Check,
  X,
  Menu,
  Database,
  ArrowUpRight,
  FileSpreadsheet,
  Flame,
  BookmarkCheck,
  Send,
  HelpCircle,
  Sliders,
  CheckCheck,
  Bot,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchAdminCatalog,
  fetchAdminUsers,
  fetchAdminReviews,
  updateUserRole,
  deleteUserRatingAction,
  updateAnimeAiringAction,
  fetchSiteSettings,
  saveSiteSettings,
  exportCsvAction,
  getAdminOverviewData,
  triggerReleaseBotAction,
} from '@/app/actions/admin-dashboard';
import { upsertAnimeAction, toggleAnimePublishAction, deleteAnimeAction } from '@/app/actions/admin';
import { getDisplayTitle } from '@/lib/format';

interface AdminDashboardProps {
  initialData: any;
  allGenres: any[];
}

type TabKey =
  | 'overview'
  | 'catalog'
  | 'users'
  | 'reviews'
  | 'calendar'
  | 'sources'
  | 'reports'
  | 'audit'
  | 'settings';

export function AdminDashboard({ initialData, allGenres }: AdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog tab states
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogItems, setCatalogItems] = useState<any[]>(initialData.topAnime || []);
  const [catalogTotal, setCatalogTotal] = useState(initialData.metrics.totalAnime);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatus, setCatalogStatus] = useState('all');
  const [catalogFormat, setCatalogFormat] = useState('all');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editingAnime, setEditingAnime] = useState<any | null>(null);
  const [savingAnime, setSavingAnime] = useState(false);

  // Users tab states
  const [usersList, setUsersList] = useState<any[]>(initialData.recentUsers || []);
  const [usersTotal, setUsersTotal] = useState(initialData.metrics.totalUsers);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('all');
  const [usersLoading, setUsersLoading] = useState(false);

  // Reviews tab states
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Calendar edit states
  const [editingAiring, setEditingAiring] = useState<{ id: string; title: string; nextEp: string; day: string } | null>(null);

  // Auto-Bot states
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botToast, setBotToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [botStats, setBotStats] = useState<{
    scanned?: number;
    updated?: number;
    added?: number;
    skippedAdult?: number;
    timestamp?: string;
  } | null>(null);

  const handleRunBot = async () => {
    setIsBotRunning(true);
    try {
      const res = await triggerReleaseBotAction(50);
      if (res.success && res.data) {
        setBotStats(res.data);
        setBotToast({
          message: `Робот успешно обновил релизы! Обновлено: ${res.data.updated}, Добавлено: ${res.data.added}, 18+ отфильтровано: ${res.data.skippedAdult}`,
          type: 'success',
        });
        setTimeout(() => setBotToast(null), 6000);
        const fresh = await getAdminOverviewData(period);
        setData(fresh);
      } else {
        setBotToast({
          message: ('error' in res ? res.error : 'Ошибка синхронизации') || 'Сбой',
          type: 'error',
        });
        setTimeout(() => setBotToast(null), 5000);
      }
    } catch (err: any) {
      setBotToast({
        message: err?.message || 'Ошибка сети при запуске робота',
        type: 'error',
      });
      setTimeout(() => setBotToast(null), 5000);
    } finally {
      setIsBotRunning(false);
    }
  };

  // Settings tab states
  const [settingsData, setSettingsData] = useState<any>({
    siteName: 'Анимо',
    tagline: 'Каталог аниме, трекер серий и календарь релизов',
    description: 'Полная база данных на 38 000+ аниме, персональный трекер серий и календарь релизов.',
    allowRegistrations: true,
    maintenanceMode: false,
    telegramUrl: 'https://t.me/animo',
    vkUrl: 'https://vk.com/animo',
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Mount effect & theme preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('animo_admin_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    fetchSiteSettings().then((s) => {
      if (s.general || s.features || s.socials) {
        setSettingsData((prev: any) => ({
          ...prev,
          siteName: s.general?.siteName || prev.siteName,
          tagline: s.general?.tagline || prev.tagline,
          description: s.general?.description || prev.description,
          allowRegistrations: s.features?.allowRegistration ?? true,
          telegramUrl: s.socials?.telegram || prev.telegramUrl,
          vkUrl: s.socials?.vk || prev.vkUrl,
        }));
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('animo_admin_theme', next);
  };

  // Change period and refetch real data
  const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d' | '1y' | 'all') => {
    setPeriod(newPeriod);
    setPeriodMenuOpen(false);
    startTransition(async () => {
      try {
        const fresh = await getAdminOverviewData(newPeriod);
        setData(fresh);
      } catch (err) {
        console.error('Error refreshing period data:', err);
      }
    });
  };

  // Load catalog items when catalog tab active or filters change
  const loadCatalog = async (page = 1) => {
    setCatalogLoading(true);
    try {
      const res = await fetchAdminCatalog({
        page,
        perPage: 15,
        search: catalogSearch,
        status: catalogStatus,
        format: catalogFormat,
      });
      setCatalogItems(res.items);
      setCatalogTotal(res.total);
      setCatalogPage(page);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetchAdminUsers({
        page: 1,
        perPage: 25,
        search: usersSearch,
        role: usersRole,
      });
      setUsersList(res.users);
      setUsersTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load reviews
  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetchAdminReviews({ page: 1, perPage: 25 });
      setReviewsList(res.items);
      setReviewsTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') loadCatalog(1);
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reviews') loadReviews();
  }, [activeTab]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const adminName = data.currentUser?.username || 'Администратор';

  // Toggle publish
  const handleTogglePublish = async (item: any) => {
    const nextState = !item.is_published;
    setCatalogItems((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, is_published: nextState } : a))
    );
    await toggleAnimePublishAction(item.id, nextState);
  };

  // Delete anime
  const handleDeleteAnime = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тайтл из базы? Действие необратимо.')) return;
    setCatalogItems((prev) => prev.filter((a) => a.id !== id));
    await deleteAnimeAction(id);
  };

  // Save anime modal form
  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnime) return;
    setSavingAnime(true);
    try {
      await upsertAnimeAction(editingAnime);
      setEditingAnime(null);
      loadCatalog(catalogPage);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAnime(false);
    }
  };

  // Toggle user role
  const handleToggleUserRole = async (u: any) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Изменить роль пользователя @${u.username || 'user'} на ${newRole}?`)) return;
    setUsersList((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, role: newRole } : item))
    );
    await updateUserRole(u.id, newRole);
  };

  // Delete review
  const handleDeleteRating = async (id: string) => {
    if (!confirm('Удалить эту оценку пользователя?')) return;
    setReviewsList((prev) => prev.filter((r) => r.id !== id));
    await deleteUserRatingAction(id);
  };

  // Export CSV helper
  const handleExportCsv = async (type: 'anime' | 'users' | 'activity') => {
    const res = await exportCsvAction(type);
    if (res.csv) {
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename || `export-${type}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Save settings
  const handleSaveAllSettings = async () => {
    await saveSiteSettings('general', {
      siteName: settingsData.siteName,
      tagline: settingsData.tagline,
      description: settingsData.description,
    });
    await saveSiteSettings('socials', {
      telegram: settingsData.telegramUrl,
      vk: settingsData.vkUrl,
    });
    await saveSiteSettings('features', {
      allowRegistration: settingsData.allowRegistrations,
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Dynamic Theme Class names
  const isDark = theme === 'dark';
  const themeBg = isDark ? 'bg-[#0c0a14] text-slate-100' : 'bg-[#F7F8FC] text-slate-800';
  const cardBg = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
    : 'bg-white border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)]';
  const cardSubtle = isDark ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-slate-50 border border-slate-200/50';
  const borderCol = isDark ? 'border-white/[0.08]' : 'border-slate-200/80';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#F7F8FC]" />;
  }

  return (
    <div className={`fixed inset-0 z-40 flex overflow-hidden font-sans select-none ${themeBg}`}>
      {/* Background ambient lighting for Dark Glassmorphism */}
      {isDark && (
        <>
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        </>
      )}

      {/* ======================================================== */}
      {/* 1. SIDEBAR (Collapsible & Grouped, matches references)     */}
      {/* ======================================================== */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 transition-transform duration-300 flex flex-col justify-between ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isDark ? 'bg-[#100d1c]/95 backdrop-blur-2xl border-r border-white/10' : 'bg-white border-r border-slate-200/80 shadow-sm'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none py-5 px-4 space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
                  <span>АНИМО</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider">
                    Admin
                  </span>
                </span>
                <span className={`text-[11px] font-medium ${textMuted}`}>Панель управления</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-5 text-xs font-semibold">
            {/* Группа 1: ГЛАВНОЕ */}
            <div>
              <div className={`px-2 mb-2 text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>
                Главное
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-[13px]">Обзор</span>
                </div>
                {activeTab === 'overview' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            </div>

            {/* Группа 2: КОНТЕНТ */}
            <div className="space-y-1">
              <div className={`px-2 mb-2 text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>
                Контент
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('catalog');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4" />
                  <span className="text-[13px]">Каталог аниме</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'catalog' ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {data.metrics?.totalAnime || 38335}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('calendar');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="text-[13px] truncate">Календарь релизов</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 uppercase tracking-wider shrink-0">
                    Робот
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'calendar' ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {data.metrics?.totalOngoings || 97}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sources');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'sources'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4" />
                  <span className="text-[13px]">Источники и импорт</span>
                </div>
              </button>
            </div>

            {/* Группа 3: ЛЮДИ */}
            <div className="space-y-1">
              <div className={`px-2 mb-2 text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>
                Люди
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('users');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-[13px]">Пользователи</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {data.metrics?.totalUsers || 3}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[13px]">Отзывы и оценки</span>
                </div>
              </button>
            </div>

            {/* Группа 4: СИСТЕМА */}
            <div className="space-y-1">
              <div className={`px-2 mb-2 text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>
                Система
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reports');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-[13px]">Отчёты и экспорт</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('audit');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[13px]">Журнал действий</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  <span className="text-[13px]">Настройки</span>
                </div>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${borderCol} space-y-3`}>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className={`flex items-center gap-2 text-xs font-semibold ${textMuted} hover:text-indigo-600 transition-colors`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Перейти на сайт</span>
            </Link>

            {/* Quick theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Сменить тему"
              className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-white/10 text-amber-400 hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User profile strip */}
          <div className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {adminName[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight">{adminName}</p>
              <p className={`text-[10px] truncate ${textMuted}`}>Супер-администратор</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN VIEWPORT (Header + Scrollable Dashboard Content)  */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header
          className={`h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 border-b ${borderCol} ${
            isDark ? 'bg-[#0c0a14]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'
          }`}
        >
          {/* Mobile hamburger & search input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full hidden sm:block">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по админке... (Ctrl+K)"
                className={`w-full h-9 pl-9 pr-4 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500'
                    : 'bg-slate-100 border border-transparent text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Top Actions: Period selector, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Period Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {period === '7d'
                    ? 'Последние 7 дней'
                    : period === '30d'
                    ? 'Последние 30 дней'
                    : period === '90d'
                    ? 'Последние 3 месяца'
                    : period === '1y'
                    ? '1 год'
                    : 'Все время'}
                </span>
                {isPending ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 rotate-90 text-slate-400" />
                )}
              </button>

              {periodMenuOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-48 rounded-2xl py-1.5 z-50 shadow-2xl border ${
                    isDark ? 'bg-[#151224] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {[
                    { key: '7d', label: 'Последние 7 дней' },
                    { key: '30d', label: 'Последние 30 дней' },
                    { key: '90d', label: 'Последние 3 месяца' },
                    { key: '1y', label: '1 год' },
                    { key: 'all', label: 'Все время' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handlePeriodChange(p.key as any)}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-indigo-500/10 ${
                        period === p.key ? 'text-indigo-600 font-bold' : ''
                      }`}
                    >
                      <span>{p.label}</span>
                      {period === p.key && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Уведомления"
                className={`p-2 rounded-xl border relative transition-colors ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-rose-500/30 animate-pulse" />
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div
                    className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl p-4 z-50 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border backdrop-blur-2xl transition-all ${
                      isDark
                        ? 'bg-[#1b1730] border-indigo-500/30 text-white'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold tracking-tight">Уведомления</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Новых: 3
                      </span>
                    </div>

                    <div className="py-3 space-y-2.5">
                      {/* Notification 1: Auto-Bot */}
                      <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-white dark:text-white">Авто-робот 24/7 активен</p>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              В сети
                            </span>
                          </div>
                          <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Сам проверяет AniList и Shikimori ежедневно в 03:00 UTC и обновляет серии.
                          </p>
                        </div>
                      </div>

                      {/* Notification 2: 18+ Filter */}
                      <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-white dark:text-white">Фильтр 18+ защищает сайт</p>
                            <span className="text-[10px] text-slate-400 font-medium">100%</span>
                          </div>
                          <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Контент Hentai, Rx и 18+ исключён из каталога, поиска, календаря и рекомендаций.
                          </p>
                        </div>
                      </div>

                      {/* Notification 3: Ongoings */}
                      <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-white dark:text-white">
                              {data.metrics?.totalOngoings || 518} онгоингов в эфире
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">Сегодня</span>
                          </div>
                          <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Все даты серий синхронизированы и отображаются в часовом поясе пользователя.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          handleRunBot();
                        }}
                        disabled={isBotRunning}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBotRunning ? 'animate-spin' : ''}`} />
                        Запустить робота сейчас
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className={`text-xs font-medium px-3 py-1 rounded-lg ${
                          isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Сменить тему"
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* ==================================================================== */}
          {/* TAB: OVERVIEW (Main Dashboard view exactly as references)             */}
          {/* ==================================================================== */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* 1. Greeting & Hero Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {greeting}, {adminName} 👋
                  </h1>
                  <p className={`text-xs sm:text-sm mt-0.5 ${textMuted}`}>
                    Сводные показатели каталога, онгоингов и активности аудитории за выбранный период.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('anime')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Экспорт данных</span>
                  </button>
                </div>
              </div>

              {/* 2. Four Metrics Cards in a Row (Ref: CRM / Finance Dashboards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Metric 1: Total Users */}
                <div className={`p-5 rounded-2xl transition-transform hover:-translate-y-0.5 duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      Всего пользователей
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {data.metrics?.totalUsers?.toLocaleString('ru-RU') || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {data.metrics?.userDelta || '+12.5%'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-2 ${textMuted}`}>Активные профили с трекингом</p>
                </div>

                {/* Metric 2: Total Anime */}
                <div className={`p-5 rounded-2xl transition-transform hover:-translate-y-0.5 duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      Тайтлов в каталоге
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Film className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {data.metrics?.totalAnime?.toLocaleString('ru-RU') || '38 335'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {data.metrics?.animeDelta || '+1.4%'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-2 ${textMuted}`}>100% с обложками (без 18+)</p>
                </div>

                {/* Metric 3: Active Ongoings */}
                <div className={`p-5 rounded-2xl transition-transform hover:-translate-y-0.5 duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      Активных онгоингов
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {data.metrics?.totalOngoings?.toLocaleString('ru-RU') || '97'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {data.metrics?.ongoingDelta || '+2.1%'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-2 ${textMuted}`}>С точным таймером выхода</p>
                </div>

                {/* Metric 4: Tracking Additions */}
                <div className={`p-5 rounded-2xl transition-transform hover:-translate-y-0.5 duration-200 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      Добавлений в списки
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                      <BookmarkCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {data.totalTracked?.toLocaleString('ru-RU') || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {data.metrics?.trackingDelta || '+8.1%'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-2 ${textMuted}`}>За всё время трекинга</p>
                </div>
              </div>

              {/* 2.5. Autonomous Release Bot Master Widget on Overview Tab */}
              <div className={`p-6 rounded-2xl border transition-all ${cardBg} ${borderCol} relative overflow-hidden shadow-lg`}>
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 ring-4 ring-indigo-500/20">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                            Авто-робот синхронизации релизов 24/7
                          </h3>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            В сети • Ежедневно (03:00 UTC)
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Автономно проверяет <strong>AniList</strong> и <strong>Shikimori</strong>, обновляет серии, таймеры выхода и постеры без участия человека.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Фильтр 18+: Строгий (Hentai, Ecchi, Rx заблокированы на 100%)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        AniList + Shikimori API
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium ${isDark ? 'bg-white/5 text-slate-300 border border-white/10' : 'bg-slate-100 text-slate-700'}`}>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {botStats?.timestamp
                          ? `Посл. запуск: ${new Date(botStats.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Посл. запуск: сегодня'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                    <button
                      type="button"
                      disabled={isBotRunning}
                      onClick={handleRunBot}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-50 active:scale-95 cursor-pointer ring-2 ring-indigo-400/20"
                    >
                      <RefreshCw className={`w-4 h-4 ${isBotRunning ? 'animate-spin' : ''}`} />
                      {isBotRunning ? 'Робот сканирует новинки...' : '⚡ Запустить синхронизацию сейчас'}
                    </button>
                  </div>
                </div>

                {botStats && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <span className={`text-[11px] block font-medium ${textMuted}`}>Просканировано</span>
                      <span className="text-base font-extrabold">{botStats.scanned || 0}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <span className={`text-[11px] block font-medium ${textMuted}`}>Обновлено серий</span>
                      <span className="text-base font-extrabold text-indigo-400">{botStats.updated || 0}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <span className={`text-[11px] block font-medium ${textMuted}`}>Добавлено новинок</span>
                      <span className="text-base font-extrabold text-emerald-400">+{botStats.added || 0}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <span className={`text-[11px] block font-medium ${textMuted}`}>18+ отклонено</span>
                      <span className="text-base font-extrabold text-rose-400">🚫 {botStats.skippedAdult || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Analytics Charts Grid: AreaChart (Activity) + DonutChart (Status Breakdown) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Area Chart: Activity over time (8 cols) */}
                <div className={`lg:col-span-8 p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">
                        Активность аудитории
                      </h3>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>
                        Динамика регистраций и добавлений в персональные списки
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-indigo-500 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                        Добавления
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-purple-500 font-semibold ml-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                        Регистрации
                      </span>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="indigoArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={isDark ? 0.4 : 0.25} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={isDark ? 0.3 : 0.2} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1e1b2e' : '#ffffff',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="additions"
                          name="Добавления"
                          stroke="#6366F1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#indigoArea)"
                        />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          name="Регистрации"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#purpleArea)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart: List Statuses Breakdown (4 cols) (Ref: Goal Progress & Deal Stages) */}
                <div className={`lg:col-span-4 p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">
                        Статусы в списках
                      </h3>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>Распределение тайтлов</p>
                    </div>
                  </div>

                  <div className="relative h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.statusBreakdown}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {data.statusBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold tracking-tight">
                        {data.totalTracked || 0}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>
                        в списках
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
                    {data.statusBreakdown.map((item: any) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          <span>{item.value}</span>
                          <span className={`text-[11px] font-normal ${textMuted}`}>
                            ({item.percent}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Second Analytics Row: BarChart (User Growth) + Popular Genres */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* User Growth Monthly Bar Chart (6 cols) */}
                <div className={`lg:col-span-6 p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">
                        Рост пользователей по месяцам
                      </h3>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>Динамика регистраций на платформе</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      +100% за год
                    </span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="month"
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1e1b2e' : '#ffffff',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                            borderRadius: '16px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="users" name="Пользователи" fill="#6366F1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Genres with Progress Bars (6 cols) (Ref: Performance by Subject) */}
                <div className={`lg:col-span-6 p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">
                        Популярные жанры у аудитории
                      </h3>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>Доли интересов в каталоге</p>
                    </div>
                    <Link
                      href="/catalog"
                      target="_blank"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Каталог <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-3.5 my-auto">
                    {data.popularGenres?.map((genre: any) => (
                      <div key={genre.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">{genre.name}</span>
                          <span className={`font-bold ${textMuted}`}>{genre.percent}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${genre.percent}%`,
                              backgroundColor: genre.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Bottom Grid: Top Anime + Upcoming Releases + Recent Users */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Block 1: Top Anime (Watchlist Style) */}
                <div className={`p-5 rounded-2xl flex flex-col ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Топ тайтлов платформы
                    </h4>
                    <span className={`text-[11px] ${textMuted}`}>Популярность</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-2">
                    {data.topAnime?.slice(0, 5).map((anime: any) => (
                      <div key={anime.id} className="pt-2 flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
                          {anime.poster_url && (
                            <Image
                              src={anime.poster_url}
                              alt={anime.title_ru || anime.title_en || ''}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">
                            {anime.title_ru || anime.title_en}
                          </p>
                          <p className={`text-[10px] ${textMuted} truncate`}>{anime.format || 'ТВ'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {typeof anime.score === 'number' && (
                              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                ★ {anime.score.toFixed(1)}
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1 rounded">
                              +18.4%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Block 2: Upcoming Airing Releases */}
                <div className={`p-5 rounded-2xl flex flex-col ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Ближайшие релизы
                    </h4>
                    <Link
                      href="/calendar"
                      target="_blank"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Календарь →
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-2">
                    {data.upcomingAiring?.slice(0, 5).map((ep: any) => (
                      <div key={ep.id} className="pt-2 flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
                          {ep.poster_url && (
                            <Image
                              src={ep.poster_url}
                              alt={ep.title_ru || ep.title_en || ''}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">
                            {ep.title_ru || ep.title_en}
                          </p>
                          <p className={`text-[10px] text-emerald-600 font-semibold mt-0.5`}>
                            {ep.next_episode_at
                              ? new Date(ep.next_episode_at).toLocaleDateString('ru-RU', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Скоро'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Block 3: Recent Registrations */}
                <div className={`p-5 rounded-2xl flex flex-col ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      Недавние регистрации
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Все →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-2">
                    {data.recentUsers?.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="pt-2 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">@{user.username || 'user'}</p>
                          <p className={`text-[10px] ${textMuted} truncate`}>{user.email || '—'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Data Quality & Health Issues Block */}
              {data.qualityIssues?.length > 0 && (
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/60 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">
                        Качество данных (требуют внимания редактора)
                      </h4>
                    </div>
                    <span className="text-xs text-amber-600 font-semibold">
                      {data.qualityIssues.length} тайтлов
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.qualityIssues.slice(0, 6).map((item: any) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
                          isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-200/80 shadow-sm'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {item.title_ru || item.title_en || 'Без названия'}
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            {!item.poster_url
                              ? 'Нет постера'
                              : !item.title_ru
                              ? 'Нет русского названия'
                              : 'Нет описания'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingAnime(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm shrink-0"
                        >
                          Исправить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: CATALOG (Full anime management table & editor modal)             */}
          {/* ==================================================================== */}
          {activeTab === 'catalog' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Каталог аниме</h2>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>
                    Управление тайтлами, постерами, публикацией и описаниями ({catalogTotal} записей)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAnime({
                      title_ru: '',
                      title_en: '',
                      title_jp: '',
                      status: 'ongoing',
                      format: 'ТВ Сериал',
                      year: new Date().getFullYear(),
                      episodes: 12,
                      is_published: true,
                      description: '',
                      poster_url: '',
                      banner_url: '',
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить аниме</span>
                </button>
              </div>

              {/* Filters bar */}
              <div className={`p-4 rounded-2xl flex flex-wrap items-center gap-3 ${cardBg}`}>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadCatalog(1)}
                    placeholder="Поиск по названию (ru, en, jp)..."
                    className={`w-full h-9 pl-9 pr-4 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  />
                </div>

                <select
                  value={catalogStatus}
                  onChange={(e) => {
                    setCatalogStatus(e.target.value);
                    setTimeout(() => loadCatalog(1), 50);
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-medium focus:outline-none ${
                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <option value="all">Все статусы</option>
                  <option value="ongoing">Онгоинг</option>
                  <option value="finished">Завершен</option>
                </select>

                <select
                  value={catalogFormat}
                  onChange={(e) => {
                    setCatalogFormat(e.target.value);
                    setTimeout(() => loadCatalog(1), 50);
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-medium focus:outline-none ${
                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <option value="all">Все форматы</option>
                  <option value="ТВ Сериал">ТВ Сериал</option>
                  <option value="Фильм">Фильм</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadCatalog(1)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Найти
                </button>
              </div>

              {/* Table */}
              <div className={`rounded-2xl overflow-hidden border ${cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`uppercase text-[10px] tracking-wider border-b ${borderCol} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                      <tr>
                        <th className="py-3 px-4">Тайтл</th>
                        <th className="py-3 px-3">Формат</th>
                        <th className="py-3 px-3">Год</th>
                        <th className="py-3 px-3">Рейтинг</th>
                        <th className="py-3 px-3">Статус</th>
                        <th className="py-3 px-3">Публикация</th>
                        <th className="py-3 px-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {catalogLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                            Загрузка тайтлов каталога...
                          </td>
                        </tr>
                      ) : catalogItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Ничего не найдено по заданным фильтрам
                          </td>
                        </tr>
                      ) : (
                        catalogItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <div className="w-9 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                                {item.poster_url && (
                                  <Image
                                    src={item.poster_url}
                                    alt={item.title_ru || item.title_en || ''}
                                    fill
                                    className="object-cover"
                                    sizes="36px"
                                    unoptimized
                                  />
                                )}
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <Link
                                  href={`/anime/${item.slug}`}
                                  target="_blank"
                                  className="font-bold hover:text-indigo-600 transition-colors truncate block"
                                >
                                  {item.title_ru || item.title_en}
                                </Link>
                                {item.title_ru && item.title_en && (
                                  <span className={`text-[11px] truncate block ${textMuted}`}>
                                    {item.title_en}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-semibold">
                                {item.format || 'ТВ'}
                              </span>
                            </td>
                            <td className="py-3 px-3">{item.year || '—'}</td>
                            <td className="py-3 px-3">
                              {item.score ? (
                                <span className="font-bold text-amber-500 flex items-center gap-0.5">
                                  ★ {item.score.toFixed(1)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'ongoing'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                              }`}>
                                {item.status === 'ongoing' ? 'Онгоинг' : 'Завершен'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(item)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                  item.is_published
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : 'bg-rose-500/15 text-rose-600'
                                }`}
                              >
                                {item.is_published ? (
                                  <>
                                    <Eye className="w-3 h-3" /> Опубликован
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3" /> Скрыт
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingAnime(item)}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400"
                                  title="Редактировать"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnime(item.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={`p-4 border-t ${borderCol} flex items-center justify-between text-xs`}>
                  <span className={textMuted}>
                    Показано {(catalogPage - 1) * 15 + 1}–{Math.min(catalogPage * 15, catalogTotal)} из {catalogTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={catalogPage <= 1}
                      onClick={() => loadCatalog(catalogPage - 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 disabled:opacity-40"
                    >
                      Назад
                    </button>
                    <span className="font-bold px-2">{catalogPage}</span>
                    <button
                      type="button"
                      disabled={catalogPage * 15 >= catalogTotal}
                      onClick={() => loadCatalog(catalogPage + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 disabled:opacity-40"
                    >
                      Вперёд
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: USERS (User profiles table & role assignment)                    */}
          {/* ==================================================================== */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Пользователи платформы</h2>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>
                    Управление ролями, просмотр профилей ({usersTotal} зарегистрировано)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('users')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Экспорт CSV</span>
                </button>
              </div>

              {/* Table */}
              <div className={`rounded-2xl overflow-hidden border ${cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`uppercase text-[10px] tracking-wider border-b ${borderCol} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                      <tr>
                        <th className="py-3 px-4">Пользователь</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3">Роль</th>
                        <th className="py-3 px-3">Дата регистрации</th>
                        <th className="py-3 px-4 text-right">Управление ролью</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {u.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <Link
                                href={`/u/${u.username}`}
                                target="_blank"
                                className="font-bold hover:text-indigo-600 transition-colors block"
                              >
                                @{u.username || 'user'}
                              </Link>
                              <span className={`text-[10px] ${textMuted}`}>ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">{u.email || '—'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {new Date(u.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleUserRole(u)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                u.role === 'admin'
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              {u.role === 'admin' ? 'Снять права админа' : 'Сделать админом'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: REVIEWS (User ratings moderation)                                */}
          {/* ==================================================================== */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">Отзывы и оценки пользователей</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Модерация оценок в персональных списках пользователей ({reviewsTotal} записей)
                </p>
              </div>

              <div className={`rounded-2xl overflow-hidden border ${cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`uppercase text-[10px] tracking-wider border-b ${borderCol} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                      <tr>
                        <th className="py-3 px-4">Пользователь</th>
                        <th className="py-3 px-3">Аниме</th>
                        <th className="py-3 px-3">Оценка</th>
                        <th className="py-3 px-3">Статус</th>
                        <th className="py-3 px-3">Дата</th>
                        <th className="py-3 px-4 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {reviewsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            Нет добавленных оценок в базе
                          </td>
                        </tr>
                      ) : (
                        reviewsList.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="py-3 px-4 font-bold">@{r.user?.username || 'пользователь'}</td>
                            <td className="py-3 px-3 font-semibold">{r.anime?.title_ru || r.anime?.title_en || 'Тайтл'}</td>
                            <td className="py-3 px-3">
                              {r.score ? (
                                <span className="font-bold text-amber-500">★ {r.score}</span>
                              ) : (
                                'Без оценки'
                              )}
                            </td>
                            <td className="py-3 px-3">{r.status}</td>
                            <td className="py-3 px-3 text-[11px] text-slate-400">
                              {new Date(r.updated_at).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRating(r.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Удалить оценку"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: CALENDAR (Release schedule management)                           */}
          {/* ==================================================================== */}
          {activeTab === 'calendar' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Auto-Bot Banner Card */}
              <div className={`p-6 rounded-2xl border transition-all ${cardBg} ${borderCol} relative overflow-hidden shadow-sm`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base flex flex-wrap items-center gap-2">
                          Авто-робот синхронизации новинок 24/7
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Активен (Ежедневно в 03:00 UTC)
                          </span>
                        </h3>
                        <p className={`text-xs ${textMuted}`}>
                          Автономный планировщик Vercel Cron. Сам забирает новые серии с AniList и Shikimori, обновляет таймеры и выкладывает на сайт без ручного труда.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Фильтр 18+: Строгий (Hentai, Rx, 18+ блокируются 100%)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-500/20">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        AniList + Shikimori API
                      </span>
                      {botStats?.timestamp && (
                        <span className={`text-[11px] ${textMuted} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          Посл. запуск: {new Date(botStats.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                    <button
                      type="button"
                      disabled={isBotRunning}
                      onClick={handleRunBot}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isBotRunning ? 'animate-spin' : ''}`} />
                      {isBotRunning ? 'Робот сканирует новинки...' : 'Запустить синхронизацию сейчас'}
                    </button>
                  </div>
                </div>

                {botStats && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                      <span className={`text-[10px] block font-medium ${textMuted}`}>Просканировано</span>
                      <span className="text-sm font-bold">{botStats.scanned || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                      <span className={`text-[10px] block font-medium ${textMuted}`}>Обновлено серий</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{botStats.updated || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                      <span className={`text-[10px] block font-medium ${textMuted}`}>Добавлено тайтлов</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{botStats.added || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                      <span className={`text-[10px] block font-medium ${textMuted}`}>18+ отфильтровано</span>
                      <span className="text-sm font-bold text-rose-500">🚫 {botStats.skippedAdult || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">Расписание релизов онгоингов</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Управление датами выхода серий и расписанием недели ({data.metrics?.totalOngoings || 0} онгоингов)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.upcomingAiring?.map((item: any) => (
                  <div key={item.id} className={`p-4 rounded-2xl flex gap-3 ${cardBg}`}>
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative">
                      {item.poster_url && (
                        <Image
                          src={item.poster_url}
                          alt={item.title_ru || item.title_en || ''}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs truncate">{item.title_ru || item.title_en}</h4>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          {item.next_episode_at
                            ? new Date(item.next_episode_at).toLocaleDateString('ru-RU', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Дата уточняется'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAiring({
                            id: item.id,
                            title: item.title_ru || item.title_en,
                            nextEp: item.next_episode_at || '',
                            day: item.airing_day || '',
                          })
                        }
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Изменить дату серии
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: SOURCES & IMPORT                                                 */}
          {/* ==================================================================== */}
          {activeTab === 'sources' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">Источники данных и синхронизация</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Статус подключения к внешним аниме API и базе данных
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={`p-6 rounded-2xl space-y-4 ${cardBg}`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    AL
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">AniList GraphQL API</h4>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Основной источник расписания онгоингов, таймеров серий и рекомендаций сообщества.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Подключено
                    </span>
                    <span className={textMuted}>20 900+ тайтлов</span>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl space-y-4 ${cardBg}`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    SH
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Shikimori API v1/v2</h4>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Источник русских названий, синопсисов и 1-клик импорта списков пользователей.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Подключено
                    </span>
                    <span className={textMuted}>30 920+ тайтлов</span>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl space-y-4 ${cardBg}`}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    SB
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Supabase PostgreSQL</h4>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Локальная база данных каталога, профилей пользователей и журналов аудита.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Работает
                    </span>
                    <span className={textMuted}>{data.metrics?.totalAnime} аниме</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: REPORTS & EXPORT                                                 */}
          {/* ==================================================================== */}
          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">Отчёты и экспорт данных</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Выгрузка табличных данных в формате CSV для аналитики
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={`p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                    <h4 className="font-bold text-sm">Каталог аниме (.csv)</h4>
                    <p className={`text-xs ${textMuted}`}>
                      Выгрузка первых 1000 тайтлов: ID, названия, форматы, рейтинги, популярность.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('anime')}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать каталог</span>
                  </button>
                </div>

                <div className={`p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="space-y-2">
                    <Users className="w-8 h-8 text-purple-500" />
                    <h4 className="font-bold text-sm">База пользователей (.csv)</h4>
                    <p className={`text-xs ${textMuted}`}>
                      Выгрузка зарегистрированных профилей: ID, username, email, роль, даты создания.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('users')}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать пользователей</span>
                  </button>
                </div>

                <div className={`p-6 rounded-2xl flex flex-col justify-between ${cardBg}`}>
                  <div className="space-y-2">
                    <ShieldAlert className="w-8 h-8 text-emerald-500" />
                    <h4 className="font-bold text-sm">Журнал аудита (.csv)</h4>
                    <p className={`text-xs ${textMuted}`}>
                      Полный лог действий администраторов: изменения ролей, публикации, настройки.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('activity')}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать журнал аудита</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: AUDIT LOGS                                                       */}
          {/* ==================================================================== */}
          {activeTab === 'audit' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">Журнал действий администраторов</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Все операции редактирования, публикации и смены прав строго фиксируются
                </p>
              </div>

              <div className={`rounded-2xl overflow-hidden border ${cardBg}`}>
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase text-[10px] tracking-wider border-b ${borderCol} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                    <tr>
                      <th className="py-3 px-4">Время</th>
                      <th className="py-3 px-3">Администратор</th>
                      <th className="py-3 px-3">Действие</th>
                      <th className="py-3 px-3">Объект</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.auditLogs?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          Журнал пока пуст
                        </td>
                      </tr>
                    ) : (
                      data.auditLogs?.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(log.created_at).toLocaleString('ru-RU')}
                          </td>
                          <td className="py-3 px-3 font-bold">@{log.admin_username}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ==================================================================== */}
          {/* TAB: SETTINGS (Site meta & configuration)                             */}
          {/* ==================================================================== */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">Настройки сервиса</h2>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Общие параметры, мета-теги и ссылки на официальные сообщества
                </p>
              </div>

              {settingsSavedToast && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <CheckCheck className="w-4 h-4" />
                  Настройки успешно сохранены в базе данных!
                </div>
              )}

              <div className={`p-6 rounded-2xl space-y-4 ${cardBg}`}>
                <h4 className="font-bold text-sm">Общая информация</h4>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Название сайта</label>
                    <input
                      type="text"
                      value={settingsData.siteName}
                      onChange={(e) => setSettingsData({ ...settingsData, siteName: e.target.value })}
                      className={`w-full h-10 px-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Слоган сайта</label>
                    <input
                      type="text"
                      value={settingsData.tagline}
                      onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })}
                      className={`w-full h-10 px-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>SEO описание</label>
                    <textarea
                      rows={3}
                      value={settingsData.description}
                      onChange={(e) => setSettingsData({ ...settingsData, description: e.target.value })}
                      className={`w-full p-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl space-y-4 ${cardBg}`}>
                <h4 className="font-bold text-sm">Социальные сети</h4>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Telegram канал</label>
                    <input
                      type="text"
                      value={settingsData.telegramUrl}
                      onChange={(e) => setSettingsData({ ...settingsData, telegramUrl: e.target.value })}
                      className={`w-full h-10 px-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Группа ВКонтакте</label>
                    <input
                      type="text"
                      value={settingsData.vkUrl}
                      onChange={(e) => setSettingsData({ ...settingsData, vkUrl: e.target.value })}
                      className={`w-full h-10 px-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAllSettings}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Сохранить настройки
              </button>
            </motion.div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: EDIT / CREATE ANIME                                            */}
      {/* ==================================================================== */}
      {editingAnime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-5 border ${
              isDark ? 'bg-[#151224] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
              <h3 className="text-base font-bold">
                {editingAnime.id ? 'Редактирование тайтла' : 'Добавление аниме в каталог'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingAnime(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnime} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Название (RU)</label>
                  <input
                    type="text"
                    value={editingAnime.title_ru || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, title_ru: e.target.value })}
                    className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Название (EN)</label>
                  <input
                    type="text"
                    value={editingAnime.title_en || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, title_en: e.target.value })}
                    className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Формат</label>
                  <select
                    value={editingAnime.format || 'ТВ Сериал'}
                    onChange={(e) => setEditingAnime({ ...editingAnime, format: e.target.value })}
                    className={`w-full h-10 px-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  >
                    <option value="ТВ Сериал">ТВ Сериал</option>
                    <option value="Фильм">Фильм</option>
                    <option value="OVA">OVA</option>
                    <option value="ONA">ONA</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Статус</label>
                  <select
                    value={editingAnime.status || 'ongoing'}
                    onChange={(e) => setEditingAnime({ ...editingAnime, status: e.target.value })}
                    className={`w-full h-10 px-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  >
                    <option value="ongoing">Онгоинг</option>
                    <option value="finished">Завершен</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Год</label>
                  <input
                    type="number"
                    value={editingAnime.year || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, year: e.target.value })}
                    className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Серий</label>
                  <input
                    type="number"
                    value={editingAnime.episodes || ''}
                    onChange={(e) => setEditingAnime({ ...editingAnime, episodes: e.target.value })}
                    className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${textMuted}`}>Ссылка на постер</label>
                <input
                  type="text"
                  value={editingAnime.poster_url || ''}
                  onChange={(e) => setEditingAnime({ ...editingAnime, poster_url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${textMuted}`}>Описание сюжета (RU)</label>
                <textarea
                  rows={4}
                  value={editingAnime.description || ''}
                  onChange={(e) => setEditingAnime({ ...editingAnime, description: e.target.value })}
                  className={`w-full p-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pub"
                  checked={editingAnime.is_published}
                  onChange={(e) => setEditingAnime({ ...editingAnime, is_published: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <label htmlFor="is_pub" className="font-semibold cursor-pointer">
                  Опубликовать в каталоге
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAnime(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingAnime}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                >
                  {savingAnime ? 'Сохранение...' : 'Сохранить тайтл'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT AIRING DATE                                               */}
      {/* ==================================================================== */}
      {editingAiring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div
            className={`relative w-full max-w-md rounded-3xl p-6 space-y-4 border ${
              isDark ? 'bg-[#151224] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
            }`}
          >
            <h3 className="text-base font-bold">Изменить дату серии</h3>
            <p className={`text-xs ${textMuted}`}>{editingAiring.title}</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Дата и время выхода следующей серии (UTC)</label>
                <input
                  type="datetime-local"
                  defaultValue={editingAiring.nextEp ? editingAiring.nextEp.slice(0, 16) : ''}
                  id="airing-datetime"
                  className={`w-full h-10 px-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingAiring(null)}
                className="px-4 py-2 rounded-xl text-slate-500 font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  const input = document.getElementById('airing-datetime') as HTMLInputElement;
                  if (input) {
                    await updateAnimeAiringAction(editingAiring.id, input.value, editingAiring.day);
                    setEditingAiring(null);
                    const fresh = await getAdminOverviewData(period);
                    setData(fresh);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Auto-Bot Toast Notification */}
      <AnimatePresence>
        {botToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-md px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md border ${
              botToast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-400/30 shadow-emerald-500/25'
                : 'bg-rose-600/95 text-white border-rose-400/30 shadow-rose-500/25'
            }`}
          >
            {botToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
            )}
            <span className="flex-1 leading-snug">{botToast.message}</span>
            <button
              type="button"
              onClick={() => setBotToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
