import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Политика обработки персональных данных и защиты конфиденциальности пользователей Анимо.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-margin md:px-margin-tablet py-12">
      <div className="flex items-center gap-2 text-outline text-sm mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
        <span>/</span>
        <span className="text-on-surface">Конфиденциальность</span>
      </div>

      <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-6">
        Политика конфиденциальности
      </h1>

      <div className="flex flex-col gap-6 text-on-surface-variant font-body-md text-base leading-relaxed bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/20 shadow-sm">
        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            1. Какие данные мы собираем
          </h2>
          <p>
            Для регистрации и авторизации мы запрашиваем только ваш адрес электронной почты и имя профиля (логин). Пароли шифруются криптографическими алгоритмами (Argon2 / bcrypt) на защищённой инфраструктуре Supabase и недоступны администраторам сайта.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            2. Хранение списков и активности
          </h2>
          <p>
            Списки аниме («Смотрю», «В планах», «Просмотрено»), количество просмотренных эпизодов и персональные оценки сохраняются исключительно для отображения вашей статистики и работы календаря релизов.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            3. Сторонние сервисы и cookie
          </h2>
          <p>
            Сайт использует cookie-файлы исключительно для поддержания безопасной авторизованной сессии пользователя. Мы не передаём ваши личные данные третьим лицам или рекламным сетям.
          </p>
        </section>
      </div>
    </div>
  );
}
