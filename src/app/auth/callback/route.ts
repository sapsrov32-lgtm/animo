import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || errorDescription) {
    console.error('OAuth callback error:', error, errorDescription);
    const redirectUrl = new URL('/login', origin);
    redirectUrl.searchParams.set(
      'error',
      'Не удалось войти через Google. Попробуйте снова или используйте вход по email.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    let response = NextResponse.redirect(new URL(next, origin));

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
            response = NextResponse.redirect(new URL(next, origin));
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
    const redirectUrl = new URL('/login', origin);
    redirectUrl.searchParams.set(
      'error',
      `Ошибка подтверждения входа Google: ${exchangeError.message}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Fallback if no code provided
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'Код подтверждения не получен от Google.');
  return NextResponse.redirect(redirectUrl);
}
