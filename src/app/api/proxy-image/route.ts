import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');

  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsed = new URL(urlParam);

    // Strictly restrict proxy only to s4.anilist.co as requested
    if (parsed.hostname !== 's4.anilist.co') {
      return NextResponse.json(
        { error: 'Forbidden: only s4.anilist.co is allowed' },
        { status: 403 }
      );
    }

    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'AnimoApp/1.0',
      },
      next: { revalidate: 604800 }, // cache 7 days
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
