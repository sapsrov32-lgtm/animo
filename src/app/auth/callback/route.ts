import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Определяем публичный origin с учетом reverse-proxy на Vercel
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';

  let siteOrigin = origin;
  if (!isLocalEnv && forwardedHost) {
    siteOrigin = `${forwardedProto}://${forwardedHost}`;
  } else if (!isLocalEnv && process.env.NEXT_PUBLIC_SITE_URL) {
    siteOrigin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  if (error || errorDescription) {
    console.error('OAuth callback error:', error, errorDescription);
    const redirectUrl = new URL('/login', siteOrigin);
    redirectUrl.searchParams.set(
      'error',
      'Не удалось войти через Google. Попробуйте снова или используйте вход по email.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const targetPath = next.startsWith('/') ? next : `/${next}`;
    const redirectUrl = new URL(targetPath, siteOrigin);
    let response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.redirect(redirectUrl);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return response;
    }

    console.error('Exchange code error:', exchangeError.message);
    const errUrl = new URL('/login', siteOrigin);
    errUrl.searchParams.set(
      'error',
      `Ошибка подтверждения входа Google: ${exchangeError.message}`
    );
    return NextResponse.redirect(errUrl);
  }

  // Fallback if no code provided
  const fallbackUrl = new URL('/login', siteOrigin);
  fallbackUrl.searchParams.set('error', 'Код подтверждения не получен от Google.');
  return NextResponse.redirect(fallbackUrl);
}
