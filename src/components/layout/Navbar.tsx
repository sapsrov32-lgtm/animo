'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Календарь', href: '/calendar' },
  { label: 'Что посмотреть', href: '/recommend' },
  { label: 'Моё аниме', href: '/profile' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-60 lg:w-72">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти аниме, жанр... (⌘K)"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low/90 border border-outline-variant/30 text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </form>

          {/* Quick links to Admin & Profile */}
          <Link
            href="/admin"
            aria-label="Админ-панель"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Админ-панель"
          >
            <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
          </Link>

          {/* Profile link */}
          <Link href="/profile" className="flex items-center gap-space-xs pl-space-xs group">
            <div className="relative flex items-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-secondary/40 group-hover:border-secondary flex items-center justify-center text-secondary transition-colors overflow-hidden">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <span className="absolute -bottom-1 -right-1.5 px-1 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[9px] leading-none border border-secondary/30">
                Lv. 42
              </span>
            </div>
          </Link>
        </div>

      </div>
    </header>
  );
}
