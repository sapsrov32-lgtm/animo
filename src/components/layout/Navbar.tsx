'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';

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
  const menuRef = useRef<HTMLDivElement>(null);

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
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
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="h-16 max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link href="/" className="flex items-center gap-space-sm group">
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
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-56 lg:w-72">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти аниме... (⌘K)"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low/90 border border-outline-variant/30 text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </form>

          {/* Admin link (server verified: strictly shown only if role is admin or editor) */}
          {isStaff && (
            <Link
              href="/admin"
              aria-label="Админ-панель"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low border border-secondary/40 text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 hover:bg-primary text-primary hover:text-on-primary border border-primary/30 font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-95"
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
                className="flex items-center gap-space-xs pl-space-xs group focus:outline-none"
              >
                <div className="relative flex items-center shrink-0">
                  <div className="w-9 h-9 rounded-full bg-surface-container-high border border-secondary/40 group-hover:border-secondary flex items-center justify-center text-secondary transition-colors overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'Аватар'}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    )}
                  </div>
                  {isStaff && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[8px] leading-none border border-secondary/30">
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
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary-container/50 text-secondary-fixed text-[10px] font-label-sm">
                        {profile?.role === 'admin' ? 'Администратор' : 'Редактор'}
                      </span>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        bookmark
                      </span>
                      <span>Моё аниме</span>
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          admin_panel_settings
                        </span>
                        <span>Админ-панель</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-error hover:bg-surface-container font-label-md text-label-md transition-colors text-left"
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
    </header>
  );
}
