import { Suspense } from 'react';
import { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Вход и регистрация — Анимо',
  description: 'Авторизуйтесь в Анимо, чтобы сохранять личные списки, вести историю просмотров и выгружать карточку года.',
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md h-96 rounded-3xl bg-surface-container-low animate-pulse" />
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
