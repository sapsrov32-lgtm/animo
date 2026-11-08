'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { quickSearchAnime, QuickSearchResult } from '@/app/actions/catalog';
import { QuickSearchDropdown } from './QuickSearchDropdown';

const NAV_ITEMS = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Календарь', href: '/calendar' },
  { label: 'Что посмотреть', href: '/recommend' },
  { label: 'Моё аниме', href: '/profile' },
];

interface NavbarProps {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: UserProfile | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const menuRef = useRef<HTMLDivElement>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor';

  // Do not render consumer navbar in admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Debounced search for QuickSearchDropdown
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    setIsDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const data = await quickSearchAnime(q, 5);
        setResults(data);
      } catch (err) {
        console.error('Quick search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        desktopSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      const target = event.target as Node;
      const insideDesktop = desktopSearchContainerRef.current?.contains(target);
      const insideMobile = mobileSearchContainerRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when mobile search is opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Close mobile search & dropdown on route change
  useEffect(() => {
    setMobileSearchOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleSelectAnime = useCallback((item: QuickSearchResult) => {
    setIsDropdownOpen(false);
    setMobileSearchOpen(false);
    router.push(`/anime/${item.slug || item.id}`);
  }, [router]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      handleSelectAnime(results[selectedIndex]);
      return;
    }
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      setMobileSearchOpen(false);
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelectAnime(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-outline-variant/30 transition-all">
      <div className="h-16 max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link href="/" className="flex items-center gap-space-sm group touch-manipulation">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 rounded-full bg-secondary/30 blur-sm group-hover:bg-secondary/60 transition-all"></div>
              <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high border border-secondary/40 text-secondary">
                <span className="material-symbols-outlined text-[18px]">filter_vintage</span>
              </span>
            </div>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface group-hover:text-secondary-fixed transition-colors">
              АНИМО
            </span>
          </Link>
        </div>

        {/* Desktop Navigation pills */}
        <nav className="hidden md:flex items-center gap-space-xs p-space-xs rounded-full bg-surface-container-low/70 border border-outline-variant/20">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface shadow-[0_0_12px_rgba(208,188,255,0.2)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-space-md">
          {/* Desktop Search bar */}
          <div ref={desktopSearchContainerRef} className="hidden md:block relative w-60 lg:w-80">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
                search
              </span>
              <input
                ref={desktopSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Найти аниме... (⌘K)"
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface-container-low/90 border border-outline-variant/30 text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-2.5 text-outline hover:text-on-surface text-[16px] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </form>

            <QuickSearchDropdown
              query={searchQuery}
              results={results}
              isLoading={isLoading}
              isOpen={isDropdownOpen}
              selectedIndex={selectedIndex}
              onSelect={handleSelectAnime}
              onViewAll={handleSearchSubmit}
            />
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Поиск по аниме"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high text-on-surface border border-outline-variant/30 active:scale-95 touch-manipulation transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileSearchOpen ? 'close' : 'search'}
            </span>
          </button>

          {/* Admin link (server verified: strictly shown only if role is admin or editor) */}
          {isStaff && (
            <Link
              href="/admin"
              aria-label="Админ-панель"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low border border-secondary/40 text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm active:scale-95 touch-manipulation"
              title="Админ-панель (управление каталогом)"
            >
              <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
            </Link>
          )}

          {/* User Auth Section */}
          {!user ? (
            /* Guest: Login Button */
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 h-10 rounded-full bg-primary/15 hover:bg-primary text-primary hover:text-on-primary border border-primary/30 font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-95 touch-manipulation"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Войти</span>
            </Link>
          ) : (
            /* Logged in: Avatar with Dropdown Menu */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Меню профиля"
                className="flex items-center gap-space-xs pl-space-xs group focus:outline-none active:scale-95 touch-manipulation"
              >
                <div className="relative flex items-center shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high border border-secondary/40 group-hover:border-secondary flex items-center justify-center text-secondary transition-colors overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'Аватар'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[22px]">person</span>
                    )}
                  </div>
                  {isStaff && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[8px] leading-none border border-secondary/30 font-bold">
                      STAFF
                    </span>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl py-2 z-50 backdrop-blur-xl animate-fadeIn">
                  {/* User Header */}
                  <div className="px-4 py-2.5 border-b border-outline-variant/20">
                    <p className="font-title-card text-title-card text-on-surface font-semibold truncate">
                      {profile?.username || user.email?.split('@')[0] || 'Пользователь'}
                    </p>
                    <p className="font-body-sm text-[11px] text-outline truncate">
                      {user.email}
                    </p>
                    {isStaff && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-[10px]">
                        Администратор
                      </span>
                    )}
                  </div>

                  {/* Profile & Lists */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      prefetch={true}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      <span>Мои списки</span>
                    </Link>
                    <Link
                      href="/calendar"
                      prefetch={true}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      <span>Расписание онгоингов</span>
                    </Link>
                    {isStaff && (
                      <Link
                        href="/admin"
                        prefetch={true}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-secondary hover:bg-secondary-container/20 font-label-md text-label-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        <span>Управление базой</span>
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="pt-1 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 font-label-md text-label-md transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Down Search Overlay */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          className="md:hidden border-t border-outline-variant/20 bg-surface-container-low px-4 py-3 animate-fadeIn relative"
        >
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
              search
            </span>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Название аниме..."
              className="w-full h-11 pl-10 pr-24 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-xs font-bold"
            >
              Найти
            </button>
          </form>

          <QuickSearchDropdown
            query={searchQuery}
            results={results}
            isLoading={isLoading}
            isOpen={isDropdownOpen}
            selectedIndex={selectedIndex}
            onSelect={handleSelectAnime}
            onViewAll={handleSearchSubmit}
          />
        </div>
      )}
    </header>
  );
}
