import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  subtitle: string;
  stepInfo: string;
  icon?: string;
}

export function ComingSoon({ title, subtitle, stepInfo, icon = 'hourglass_empty' }: ComingSoonProps) {
  return (
    <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-20 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center text-secondary mb-6 shadow-xl border border-outline-variant/30">
        <span className="material-symbols-outlined text-[36px]">{icon}</span>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm uppercase tracking-wider mb-3">
        Скоро • {stepInfo}
      </div>
      <h1 className="font-display-hero text-headline-lg md:text-display-hero text-on-surface mb-4">
        {title}
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-8">
        {subtitle}
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/catalog"
          className="px-6 h-11 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          <span>Перейти в каталог</span>
        </Link>
        <Link
          href="/"
          className="px-6 h-11 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-2 transition-all"
        >
          <span>На главную</span>
        </Link>
      </div>
    </div>
  );
}
