import { NextRequest, NextResponse } from 'next/server';
import { runReleaseAutoSync } from '@/lib/sync/release-bot';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for batch sync

function isAuthorized(req: NextRequest, isAdminUser: boolean): boolean {
  // 1. Vercel cron header (sent securely by Vercel Cron service)
  if (req.headers.get('x-vercel-cron')) {
    return true;
  }

  // 2. CRON_SECRET token via Authorization header (strict check, no insecure hardcoded fallback)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 3. Authenticated admin user (strictly role === 'admin')
  if (isAdminUser) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    let isAdminUser = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'admin') {
          isAdminUser = true;
        }
      }
    } catch {
      // Continue without session
    }

    if (!isAuthorized(req, isAdminUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid or missing cron secret' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50;
    const triggerSource = req.headers.get('x-vercel-cron') ? 'vercel_cron' : isAdminUser ? 'admin_panel' : 'api_key';

    const result = await runReleaseAutoSync({ limit, triggerSource });

    return NextResponse.json({
      success: result.success,
      message: 'Release auto-sync completed successfully.',
      data: result,
    });
  } catch (err: any) {
    console.error('CRON sync-releases fatal error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error during auto-sync' },
      { status: 500 }
    );
  }
}
