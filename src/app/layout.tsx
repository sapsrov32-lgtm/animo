import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://animo.app'),
  title: {
    default: 'Анимо — кинематографичный каталог, трекер и гид по аниме',
    template: '%s | Анимо',
  },
  description:
    'Каталог, персональный трекер и гид по японской анимации на русском языке. Без пиратства, рекламы и видеоплееров.',
  keywords: ['аниме', 'каталог аниме', 'трекер аниме', 'онгоинги', 'расписание аниме', 'что посмотреть'],
  authors: [{ name: 'Анимо' }],
  creator: 'Анимо',
  openGraph: {
    title: 'Анимо — кинематографичный каталог, трекер и гид по аниме',
    description:
      'Каталог, персональный трекер и гид по японской анимации на русском языке. Без пиратства, рекламы и видеоплееров.',
    url: 'https://animo.app',
    siteName: 'Анимо',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Анимо — каталог и гид по аниме',
    description: 'Кинематографичный каталог, трекер серий и календарь онгоингов на русском языке.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    profile = data as UserProfile | null;
  }

  const clientUser = user
    ? {
        id: user.id,
        email: user.email,
      }
    : null;

  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&family=Sora:wght@600;700&subset=latin,cyrillic&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased min-h-screen selection:bg-secondary-container selection:text-on-secondary-container flex flex-col">
        <Navbar user={clientUser} profile={profile} />
        <main className="w-full pt-16 flex-1">
          {children}
        </main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}
