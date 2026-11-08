'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WatchStatus } from '@/types';

export async function setAnimeWatchStatus(
  animeId: string,
  status: WatchStatus | null,
  score?: number | null,
  progress?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthorized' };
  }

  // Strict Server-Side Input Validation
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId);
  if (!isValidUuid) {
    return { error: 'invalid_anime_id' };
  }

  const validStatuses = ['now', 'plan', 'done', 'dropped'];
  if (status !== null && !validStatuses.includes(status)) {
    return { error: 'invalid_status' };
  }

  if (score !== undefined && score !== null && (typeof score !== 'number' || score < 1 || score > 10)) {
    return { error: 'invalid_score' };
  }

  if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 20000)) {
    return { error: 'invalid_progress' };
  }

  if (status === null) {
    const { error } = await supabase
      .from('user_anime')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', animeId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/profile');
    revalidatePath(`/anime`, 'page');
    return { success: true, removed: true };
  }

  // Fetch existing record to keep existing score / progress if not specified
  const { data: existing } = await supabase
    .from('user_anime')
    .select('score, progress')
    .eq('user_id', user.id)
    .eq('anime_id', animeId)
    .maybeSingle();

  const finalScore = score !== undefined ? score : existing?.score ?? null;
  const finalProgress = progress !== undefined ? progress : existing?.progress ?? 0;

  const { data, error } = await supabase
    .from('user_anime')
    .upsert(
      {
        user_id: user.id,
        anime_id: animeId,
        status,
        score: finalScore,
        progress: finalProgress,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,anime_id',
      }
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/anime`, 'page');

  return { success: true, data };
}

export async function setAnimeScore(animeId: string, score: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthorized' };
  }

  // Strict Server-Side Input Validation
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId);
  if (!isValidUuid) {
    return { error: 'invalid_anime_id' };
  }

  if (score !== null && (typeof score !== 'number' || score < 1 || score > 10)) {
    return { error: 'invalid_score' };
  }

  const { data: existing } = await supabase
    .from('user_anime')
    .select('status, progress')
    .eq('user_id', user.id)
    .eq('anime_id', animeId)
    .maybeSingle();

  // If item is not in list yet, set status to 'done' when scored
  const status = existing?.status || 'done';
  const progress = existing?.progress || 0;

  const { data, error } = await supabase
    .from('user_anime')
    .upsert(
      {
        user_id: user.id,
        anime_id: animeId,
        status,
        score,
        progress,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,anime_id',
      }
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/anime`, 'page');

  return { success: true, data };
}

export async function setAnimeProgress(animeId: string, progress: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthorized' };
  }

  // Strict Server-Side Input Validation
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId);
  if (!isValidUuid) {
    return { error: 'invalid_anime_id' };
  }

  if (typeof progress !== 'number' || progress < 0 || progress > 20000) {
    return { error: 'invalid_progress' };
  }

  const { data, error } = await supabase
    .from('user_anime')
    .update({
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('anime_id', animeId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, data };
}
