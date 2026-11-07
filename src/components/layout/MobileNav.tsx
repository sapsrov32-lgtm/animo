'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_NAV_ITEMS = [
  { label: 'Главная', href: '/', icon: 'home' },
  { label: 'Каталог', href: '/catalog', icon: 'grid_view' },
  { label: 'Календарь', href: '/calendar', icon: 'calendar_month' },
  { label: 'Подбор', href: '/recommend', icon: 'explore' },
  { label: 'Моё аниме', href: '/profile', icon: 'bookmark' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant/30 px-2 pt-1.5 transition-all select-none"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all touch-manipulation active:scale-90 ${
                isActive
                  ? 'text-primary bg-primary/10 font-bold shadow-[0_0_12px_rgba(208,188,255,0.15)]'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] transition-transform"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label-sm text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
