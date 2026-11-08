'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden bg-surface">
      {/* Ambient background glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-error/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/20 border border-error/30 text-error font-label-sm text-label-sm uppercase tracking-wider mb-4">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Ошибка 500
        </div>

        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mb-3">
          Что-то пошло не так
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 leading-relaxed">
          Произошла непредвиденная ошибка при загрузке страницы. Попробуйте обновить экран или вернуться в каталог.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Попробовать снова</span>
          </button>

          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-semibold active:scale-95 transition-all border border-outline-variant/30 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>На главную</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
