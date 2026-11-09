import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // Read country ISO code from Vercel edge header (e.g. "KG", "US", "RU")
  const rawCountry = req.headers.get('x-vercel-ip-country');
  const country =
    rawCountry && rawCountry.trim().length === 2
      ? rawCountry.trim().toUpperCase()
      : null;

  return NextResponse.json(
    { country },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    }
  );
}
