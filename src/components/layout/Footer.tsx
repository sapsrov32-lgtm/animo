import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-space-xl mt-space-xl pb-24 md:pb-space-xl">
      <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-xl pb-space-xl border-b border-outline-variant/20">
          
          <div className="max-w-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-secondary/40 text-secondary">
                <span className="material-symbols-outlined text-[16px]">filter_vintage</span>
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">АНИМО</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-sm">
              Каталог аниме, трекер серий и календарь релизов.
            </p>
            <p className="font-body-sm text-body-sm text-outline">
              Анимо не размещает и не воспроизводит видео. Ссылки ведут на официальные сервисы. Данные: AniList.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-space-xl gap-y-space-md">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-1">
                Навигация
              </span>
              <Link href="/catalog" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Каталог тайтлов
              </Link>
              <Link href="/calendar" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Календарь релизов
              </Link>
              <Link href="/recommend" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Что посмотреть
              </Link>
              <Link href="/profile" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Моё аниме
              </Link>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-1">
                Правовая информация
              </span>
              <Link href="/terms" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Правила сервиса
              </Link>
              <Link href="/privacy" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                Политика конфиденциальности
              </Link>
            </div>
          </div>

        </div>

        <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-outline font-body-sm text-body-sm">
          <span>© {currentYear} АНИМО. Все права защищены.</span>
          <span>Каталог, персональный трекер и календарь релизов.</span>
        </div>
      </div>
    </footer>
  );
}
