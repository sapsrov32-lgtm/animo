import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit } from '@/lib/security/rate-limiter';

const ALLOWED_ORIGINS = [
  'https://animo-virid.vercel.app',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate Limiting: 120 requests per minute per IP
  const rateLimit = checkRateLimit(ip, 120, 60000);
  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Слишком много запросов. Пожалуйста, повторите попытку через минуту.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  }

  // 2. CORS Handling for /api/ routes
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const origin = request.headers.get('origin');
  const isAllowedOrigin =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:'));

  // Handle preflight OPTIONS request for APIs
  if (isApiRoute && request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin && origin) {
      preflight.headers.set('Access-Control-Allow-Origin', origin);
    }
    preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    preflight.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-vercel-cron'
    );
    preflight.headers.set('Access-Control-Max-Age', '86400');
    return preflight;
  }

  // 3. Update Supabase Session & Session Cookies
  const response = await updateSession(request);

  // Set rate-limit headers on valid responses
  response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));

  // Set CORS on API responses
  if (isApiRoute && origin && isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - common static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
