import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0c0a14',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app'),
  title: {
    default: 'Анимо — кинематографичный каталог, трекер и онлайн-просмотр аниме',
    template: '%s | Анимо',
  },
  description:
    'Полный каталог на 38 000+ аниме, персональный трекер серий, расписание онгоингов и просмотр онлайн на русском языке.',
  keywords: ['аниме', 'каталог аниме', 'трекер аниме', 'онгоинги', 'расписание аниме', 'смотреть аниме онлайн'],
  authors: [{ name: 'Анимо' }],
  creator: 'Анимо',
  openGraph: {
    title: 'Анимо — кинематографичный каталог, трекер и онлайн-просмотр аниме',
    description:
      'Полный каталог на 38 000+ аниме, персональный трекер серий, расписание онгоингов и просмотр онлайн на русском языке.',
    url: 'https://animo-virid.vercel.app',
    siteName: 'Анимо',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Анимо — каталог и онлайн-просмотр аниме',
    description: 'Кинематографичный каталог, трекер серий и онлайн-плеер на русском языке.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: '_Df27HQ-MaBOKD6FOHWRrXmAALWVxTEuERQGFuit694',
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
        <meta name="google-site-verification" content="_Df27HQ-MaBOKD6FOHWRrXmAALWVxTEuERQGFuit694" />
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
        <main className="w-full pt-16 pb-24 md:pb-0 flex-1">
          {children}
        </main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}
