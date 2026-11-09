'use client';

import React from 'react';
import Link from 'next/link';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = 'Войдите, чтобы сохранить',
  description = 'Чтобы добавлять аниме в персональные списки, отмечать серии и ставить оценки, войдите в свой аккаунт.',
}: AuthModalProps) {
  if (!isOpen) return null;

  const currentPath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search || ''}`
      : '/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm rounded-3xl bg-surface-container-low border border-outline-variant/30 p-6 sm:p-7 shadow-2xl z-10 flex flex-col items-center text-center gap-4 animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center border border-secondary/30">
          <span className="material-symbols-outlined text-3xl">bookmark_add</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
            {title}
          </h3>
          <p className="font-body-sm text-xs text-outline leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col w-full gap-2.5 pt-2">
          <Link
            href={`/login?next=${encodeURIComponent(currentPath)}`}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Войти
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(currentPath)}`}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface font-label-md text-sm font-semibold flex items-center justify-center border border-outline-variant/30 hover:bg-surface-bright active:scale-95 transition-all"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
