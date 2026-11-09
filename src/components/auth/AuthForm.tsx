'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Tab = 'login' | 'register';

interface AuthFormProps {
  defaultTab?: Tab;
}

export function AuthForm({ defaultTab = 'login' }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || searchParams.get('next') || '/';
  const urlError = searchParams.get('error');

  const tabParam = searchParams.get('tab');
  const initialTab: Tab =
    tabParam === 'signup' || tabParam === 'register' ? 'register' : defaultTab;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (urlError) {
      if (urlError === 'forbidden') {
        setError('Доступ ограничен: панель управления доступна только администрации сервиса.');
      } else {
        setError(urlError);
      }
    }
  }, [urlError]);

  const supabase = createClient();

  // If already authenticated, redirect immediately to /profile (or next/redirect target)
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session?.user) {
        const dest =
          redirectPath &&
          redirectPath !== '/' &&
          !redirectPath.startsWith('/login') &&
          !redirectPath.startsWith('/register')
            ? redirectPath
            : '/profile';
        router.replace(dest);
      }
    });
  }, [router, redirectPath, supabase.auth]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      // Динамически определяем URL сайта:
      // 1. В браузере берется window.location.origin (на Vercel это будет https://ваш-домен.vercel.app, а локально http://localhost:3000)
      // 2. В качестве запасного варианта используется NEXT_PUBLIC_SITE_URL
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app');

      const redirectUrl = `${origin.replace(/\/$/, '')}/auth/callback${
        redirectPath && redirectPath !== '/' ? `?next=${encodeURIComponent(redirectPath)}` : ''
      }`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) {
        setError(oauthError.message || 'Ошибка авторизации через Google');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось запустить вход через Google');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      // Полная перезагрузка для гарантированного применения cookie сессии во всех компонентах
      window.location.href = redirectPath || '/';
    } catch (err: any) {
      setError(err?.message || 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      // Если сессия создана сразу
      if (data.session) {
        window.location.href = redirectPath || '/';
        return;
      }

      // Попытка войти, если почта подтверждается сразу
      if (data.user) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInData?.session) {
          window.location.href = redirectPath || '/';
          return;
        }
      }

      // Если требуется подтверждение по почте: очищаем поля и показываем уведомление
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setConfirmationSent(true);
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

            {!confirmationSent && (
              <>
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {activeTab === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-1">
                  {activeTab === 'login'
                    ? 'Войдите, чтобы синхронизировать списки и оценки'
                    : 'Зарегистрируйтесь, чтобы создать свой профиль и трекер'}
                </p>
              </>
            )}
          </div>

          {/* If confirmation email is sent: show ONLY message and cleared state */}
          {confirmationSent ? (
            <div className="flex flex-col items-center text-center py-4 gap-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center border border-secondary/30">
                <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Проверьте почту
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Мы отправили ссылку для подтверждения. Перейдите по ссылке в письме, чтобы завершить регистрацию и войти на сайт.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmationSent(false);
                  setActiveTab('login');
                }}
                className="mt-2 px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors"
              >
                Вернуться ко входу
              </button>
            </div>
          ) : (
            <>
              {/* Segmented Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
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

              {/* Alert on Error */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-error-container/20 border border-error/40 text-error font-body-sm text-body-sm flex items-start gap-2.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Button on Both Tabs */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/40 hover:border-outline-variant font-label-md text-label-md font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Продолжить с Google</span>
              </button>

              {/* Separator Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30" />
                </div>
                <span className="relative bg-surface-container-low px-3 font-body-sm text-body-sm text-outline lowercase">
                  или
                </span>
              </div>

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
                    className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
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
                    className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-secondary-container to-secondary text-on-secondary-container font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary-container/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
