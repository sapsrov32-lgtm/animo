import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CalendarWorkspace } from '@/components/calendar/CalendarWorkspace';
import { fetchCalendarAiringSchedule } from '@/lib/anilist';

export const metadata: Metadata = {
  title: 'Календарь выхода серий — Анимо',
  description:
    'Точное интерактивное расписание выхода серий аниме-онгоингов по дням недели с автоматическим пересчётом на местное время зрителя.',
  openGraph: {
    title: 'Календарь выхода серий — Анимо',
    description:
      'Точное интерактивное расписание выхода серий аниме-онгоингов по дням недели с автоматическим пересчётом на местное время зрителя.',
    url: 'https://animo-virid.vercel.app/calendar',
    siteName: 'Анимо',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Календарь выхода серий — Анимо',
    description:
      'Точное интерактивное расписание выхода серий аниме-онгоингов по дням недели с автоматическим пересчётом на местное время зрителя.',
  },
  alternates: {
    canonical: 'https://animo-virid.vercel.app/calendar',
  },
};

// Cache schedule for 30 minutes (1800 seconds)
export const revalidate = 1800;

export default async function CalendarPage() {
  const supabase = await createClient();

  // 1. Fetch official AniList airing schedule for the week (strictly non-18+, TV/ONA/OVA/Movie only)
  const schedules = await fetchCalendarAiringSchedule();

  // 2. Fetch authenticated user's tracked anime if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userAnimeMap: Record<string, { status: string; progress: number }> = {};

  if (user) {
    const { data: userAnimeData } = await supabase
      .from('user_anime')
      .select('anime_id, status, progress')
      .eq('user_id', user.id);

    if (userAnimeData) {
      userAnimeData.forEach((record) => {
        userAnimeMap[record.anime_id] = {
          status: record.status,
          progress: record.progress,
        };
      });
    }
  }

  return (
    <>
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: 'https://animo-virid.vercel.app',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Календарь выхода серий',
                item: 'https://animo-virid.vercel.app/calendar',
              },
            ],
          }),
        }}
      />
      <CalendarWorkspace
        schedules={schedules}
        userAnimeMap={userAnimeMap}
        isLoggedIn={Boolean(user)}
      />
    </>
  );
}
