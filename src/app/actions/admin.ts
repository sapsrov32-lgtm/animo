'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { AnimeStatus } from '@/types';
import { logAdminAction } from './admin-dashboard';

export interface AnimeInputData {
  id?: string;
  slug?: string;
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
  description?: string | null;
  year?: number | null;
  season?: string | null;
  status: AnimeStatus;
  format?: string | null;
  episodes?: number | null;
  shikimori_id?: number | null;
  poster_url?: string | null;
  banner_url?: string | null;
  airing_day?: string | null;
  next_episode_at?: string | null;
  score?: number | null;
  studio?: string | null;
  is_published: boolean;
  genre_ids?: string[];
}

async function verifyStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: войдите в аккаунт' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden: требуются права администратора' };
  }

  return { supabase, user, profile };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'anime';
}

export async function upsertAnimeAction(data: AnimeInputData) {
  const authCheck = await verifyStaff();
  if ('error' in authCheck) {
    return { error: authCheck.error };
  }
  const { supabase } = authCheck;

  // Generate slug if not provided
  let slug = data.slug?.trim();
  if (!slug) {
    const baseTitle = data.title_ru || data.title_en || 'anime';
    slug = `${slugify(baseTitle)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  const payload = {
    ...(data.id ? { id: data.id } : {}),
    slug,
    title_ru: data.title_ru?.trim() || null,
    title_en: data.title_en?.trim() || null,
    title_jp: data.title_jp?.trim() || null,
    description: data.description?.trim() || null,
    year: data.year ? Number(data.year) : null,
    season: data.season?.trim() || null,
    status: data.status,
    format: data.format?.trim() || 'ТВ Сериал',
    episodes: data.episodes ? Number(data.episodes) : null,
    shikimori_id: data.shikimori_id ? Number(data.shikimori_id) : null,
    poster_url: data.poster_url?.trim() || null,
    banner_url: data.banner_url?.trim() || null,
    airing_day: data.airing_day?.trim() || null,
    next_episode_at: data.next_episode_at ? new Date(data.next_episode_at).toISOString() : null,
    score: data.score ? Number(data.score) : null,
    studio: data.studio?.trim() || null,
    is_published: data.is_published,
    updated_at: new Date().toISOString(),
  };

  const { data: savedAnime, error: saveError } = await supabase
    .from('anime')
    .upsert(payload)
    .select()
    .single();

  if (saveError) {
    console.error('Error saving anime:', saveError);
    return { error: saveError.message };
  }

  // Update genres if provided
  if (data.genre_ids && savedAnime.id) {
    // Delete existing relations
    await supabase.from('anime_genres').delete().eq('anime_id', savedAnime.id);

    // Insert new relations
    if (data.genre_ids.length > 0) {
      const rows = data.genre_ids.map((genre_id) => ({
        anime_id: savedAnime.id,
        genre_id,
      }));
      await supabase.from('anime_genres').insert(rows);
    }
  }

  await logAdminAction(data.id ? 'update_anime' : 'create_anime', 'anime', savedAnime.id, {
    title: savedAnime.title_ru || savedAnime.title_en,
    slug: savedAnime.slug,
  });

  revalidatePath('/admin');
  revalidatePath('/catalog');
  revalidatePath('/calendar');
  revalidatePath('/recommend');
  revalidatePath(`/anime/${savedAnime.slug}`);

  return { success: true, anime: savedAnime };
}

export async function toggleAnimePublishAction(animeId: string, isPublished: boolean) {
  const authCheck = await verifyStaff();
  if ('error' in authCheck) {
    return { error: authCheck.error };
  }
  const { supabase } = authCheck;

  const { error } = await supabase
    .from('anime')
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', animeId);

  if (error) {
    return { error: error.message };
  }

  await logAdminAction(isPublished ? 'publish_anime' : 'unpublish_anime', 'anime', animeId);

  revalidatePath('/admin');
  revalidatePath('/catalog');
  return { success: true };
}

export async function deleteAnimeAction(animeId: string) {
  const authCheck = await verifyStaff();
  if ('error' in authCheck) {
    return { error: authCheck.error };
  }
  const { supabase } = authCheck;

  const { error } = await supabase.from('anime').delete().eq('id', animeId);

  if (error) {
    return { error: error.message };
  }

  await logAdminAction('delete_anime', 'anime', animeId);

  revalidatePath('/admin');
  revalidatePath('/catalog');
  revalidatePath('/calendar');
  return { success: true };
}
