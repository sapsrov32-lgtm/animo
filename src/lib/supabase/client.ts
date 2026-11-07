import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Возвращает браузерный синглтон-клиент Supabase.
 * Синглтон предотвращает дублирование слушателей событий и таймеров автообновления токенов,
 * сохраняя сессию пользователя на 2 года даже при закрытии и повторном открытии браузера/телефона.
 */
export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          maxAge: 60 * 60 * 24 * 365 * 2, // 2 года
          sameSite: 'lax',
          path: '/',
        },
      }
    );
  }

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          maxAge: 60 * 60 * 24 * 365 * 2, // 2 года
          sameSite: 'lax',
          path: '/',
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return client;
}
