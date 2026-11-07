'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Tab = 'login' | 'register';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_grant')
        ) {
          setError('Неверный email или пароль');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Email ещё не подтверждён. Проверьте почтовый ящик');
        } else {
          setError(signInError.message || 'Ошибка входа');
        }
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password || !confirmPassword || !username.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Пользователь с таким email уже зарегистрирован');
        } else if (signUpError.message.includes('weak')) {
          setError('Слишком простой пароль. Выберите надёжнее');
        } else {
          setError(signUpError.message || 'Ошибка регистрации');
        }
        return;
      }

      // Check if session exists (auto-confirmed) or email confirmation needed
      if (data.session) {
        setSuccessMessage('Аккаунт успешно создан! Переходим в профиль...');
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 800);
      } else {
        setSuccessMessage(
          'Регистрация успешна! Если на сервере включено подтверждение email, проверьте почту для активации.'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Glow & Card Container */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 blur-xl pointer-events-none opacity-80" />

        <div className="relative rounded-3xl bg-surface-container-low border border-outline-variant/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-1 rounded-full bg-secondary/30 blur-sm group-hover:bg-secondary/60 transition-all"></div>
                <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high border border-secondary/40 text-secondary">
                  <span className="material-symbols-outlined text-[22px]">filter_vintage</span>
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                АНИМО
              </span>
            </Link>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {activeTab === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </h1>
            <p className="font-body-sm text-body-sm text-outline mt-1">
              {activeTab === 'login'
                ? 'Войдите, чтобы синхронизировать списки и оценки'
                : 'Зарегистрируйтесь, чтобы создать свой профиль и трекер'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'login'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'register'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm flex items-start gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-primary-container/20 border border-primary/40 text-primary font-body-sm text-body-sm flex items-start gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="font-label-md text-label-md text-outline mb-1.5 block">
                  Электронная почта
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-label-md text-label-md text-outline block">
                    Пароль
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Войти</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="font-label-md text-label-md text-outline mb-1.5 block">
                  Имя пользователя (никнейм)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Например, Kenshi"
                    autoComplete="nickname"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-outline mb-1.5 block">
                  Электронная почта
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-outline mb-1.5 block">
                  Пароль (не менее 6 символов)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-outline mb-1.5 block">
                  Повторите пароль
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[18px] pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all font-body-md text-body-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary text-on-secondary-container font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary-container/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Создать аккаунт</span>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-outline-variant/20 text-center">
            <p className="font-body-sm text-body-sm text-outline">
              Продолжая, вы соглашаетесь с правилами сервиса Анимо. Без спама и сторонних рассылок.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
