import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Правила сервиса',
  description: 'Пользовательское соглашение и правила использования каталога и трекера Анимо.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-margin md:px-margin-tablet py-12">
      <div className="flex items-center gap-2 text-outline text-sm mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
        <span>/</span>
        <span className="text-on-surface">Правила сервиса</span>
      </div>

      <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-6">
        Правила сервиса «Анимо»
      </h1>

      <div className="flex flex-col gap-6 text-on-surface-variant font-body-md text-base leading-relaxed bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/20 shadow-sm">
        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            1. Статус платформы
          </h2>
          <p>
            «Анимо» является исключительно информационно-справочным каталогом, персональным трекером серий и календарём выхода японской анимации.
          </p>
          <p className="p-4 rounded-xl bg-surface-container font-medium text-on-surface border border-primary/20">
            Платформа «Анимо» НЕ размещает, НЕ хранит и НЕ воспроизводит какие-либо видеофайлы, стриминговые потоки или аудиодорожки на своих серверах. Все ссылки ведут на официальные лицензированные платформы (Crunchyroll, Netflix, Kinopoisk и др.) либо на официальные промо-материалы авторов.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            2. Источники данных
          </h2>
          <p>
            Метаданные (названия, синопсисы, жанры, расписание трансляций, постеры и официальные ссылки) предоставляются открытыми API-сервисами, включая{' '}
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              AniList
            </a>
            {' '}и сообществом поклонников.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
            3. Персональный трекер
          </h2>
          <p>
            Учётные записи пользователей используются для сохранения прогресса просмотра, личных оценок и отметок в календаре. Пользователи могут экспортировать или удалять свои данные в любой момент.
          </p>
        </section>
      </div>
    </div>
  );
}
