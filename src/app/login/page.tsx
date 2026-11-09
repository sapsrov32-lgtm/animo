import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Вход и регистрация',
  description: 'Авторизуйтесь в Анимо, чтобы сохранять личные списки, вести историю просмотров и выгружать карточку года.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string; next?: string; tab?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const target = params.redirect || params.next;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const dest =
      target &&
      target !== '/' &&
      !target.startsWith('/login') &&
      !target.startsWith('/register')
        ? target
        : '/profile';
    redirect(dest);
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md h-96 rounded-3xl bg-surface-container-low animate-pulse" />
        }
      >
        <AuthForm defaultTab="login" />
      </Suspense>
    </div>
  );
}
