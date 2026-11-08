'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WatchStatus } from '@/types';

export type ImportResult =
  | { success: true; importedCount: number; totalFound: number; message?: string }
  | { success: false; error: string };

function mapShikimoriStatus(status: string): WatchStatus {
  switch (status?.toLowerCase()) {
    case 'watching':
      return 'now';
    case 'completed':
    case 'dropped':
      return 'done';
    case 'planned':
    case 'on_hold':
    default:
      return 'plan';
  }
}

function mapMalStatus(status: string): WatchStatus {
  switch (status?.trim()) {
    case 'Watching':
      return 'now';
    case 'Completed':
    case 'Dropped':
      return 'done';
    case 'Plan to Watch':
    case 'On-Hold':
    default:
      return 'plan';
  }
}

interface ImportRateItem {
  shikimoriId: number;
  score: number | null;
  progress: number;
  status: WatchStatus;
}

async function saveImportedRates(items: ImportRateItem[]): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходимо войти в аккаунт для импорта списков' };
  }

  if (items.length === 0) {
    return { success: false, error: 'Список для импорта пуст' };
  }

  // 1. Fetch matching anime from database in batches of 500
  const shikimoriIds = items.map((i) => i.shikimoriId).filter(Boolean);
  const animeMap = new Map<number, { id: string; episodes: number | null }>();

  const BATCH_SIZE = 500;
  for (let i = 0; i < shikimoriIds.length; i += BATCH_SIZE) {
    const chunk = shikimoriIds.slice(i, i + BATCH_SIZE);
    const { data: matched, error } = await supabase
      .from('anime')
      .select('id, shikimori_id, episodes')
      .in('shikimori_id', chunk);

    if (error) {
      console.error('Error fetching matched anime chunk:', error);
      continue;
    }

    if (matched) {
      for (const a of matched) {
        if (a.shikimori_id) {
          animeMap.set(a.shikimori_id, { id: a.id, episodes: a.episodes });
        }
      }
    }
  }

  // 2. Prepare user_anime records to upsert
  const upsertRows: Array<{
    user_id: string;
    anime_id: string;
    status: WatchStatus;
    score: number | null;
    progress: number;
    updated_at: string;
  }> = [];

  for (const item of items) {
    const anime = animeMap.get(item.shikimoriId);
    if (!anime) continue;

    const maxEp = anime.episodes || 999;
    const progress = item.status === 'done' && anime.episodes ? anime.episodes : Math.min(item.progress || 0, maxEp);

    upsertRows.push({
      user_id: user.id,
      anime_id: anime.id,
      status: item.status,
      score: item.score && item.score > 0 ? item.score : null,
      progress,
      updated_at: new Date().toISOString(),
    });
  }

  if (upsertRows.length === 0) {
    return {
      success: true,
      importedCount: 0,
      totalFound: items.length,
      message: 'Не найдено совпадений с каталогом Анимо.',
    };
  }

  // 3. Upsert into user_anime in batches of 100
  const UPSERT_CHUNK = 100;
  let savedCount = 0;

  for (let i = 0; i < upsertRows.length; i += UPSERT_CHUNK) {
    const chunk = upsertRows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from('user_anime')
      .upsert(chunk, { onConflict: 'user_id,anime_id' });

    if (error) {
      console.error('Error upserting user_anime chunk:', error);
    } else {
      savedCount += chunk.length;
    }
  }

  revalidatePath('/profile');
  revalidatePath('/u/[username]', 'page');

  return {
    success: true,
    importedCount: savedCount,
    totalFound: items.length,
  };
}

export async function importFromShikimori(username: string): Promise<ImportResult> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    return { success: false, error: 'Пожалуйста, введите никнейм на Shikimori' };
  }

  try {
    const res = await fetch(
      `https://shikimori.one/api/users/${encodeURIComponent(cleanUsername)}/anime_rates?limit=5000`,
      {
        headers: {
          'User-Agent': 'AnimoAnimeTracker/1.0',
        },
        next: { revalidate: 0 },
      }
    );

    if (res.status === 404) {
      return { success: false, error: `Пользователь «${cleanUsername}» не найден на Shikimori. Проверьте правильность ника.` };
    }

    if (!res.ok) {
      return { success: false, error: `Ошибка сервера Shikimori (${res.status}). Попробуйте позже.` };
    }

    const rates = await res.json();
    if (!Array.isArray(rates)) {
      return { success: false, error: 'Неверный формат ответа от Shikimori.' };
    }

    if (rates.length === 0) {
      return { success: false, error: `У пользователя «${cleanUsername}» пустой список аниме на Shikimori.` };
    }

    const items: ImportRateItem[] = rates
      .filter((r) => r.anime?.id)
      .map((r) => ({
        shikimoriId: Number(r.anime.id),
        score: typeof r.score === 'number' && r.score > 0 ? r.score : null,
        progress: typeof r.episodes === 'number' ? r.episodes : 0,
        status: mapShikimoriStatus(r.status),
      }));

    return await saveImportedRates(items);
  } catch (err: any) {
    console.error('Shikimori import error:', err);
    return { success: false, error: 'Не удалось загрузить данные с Shikimori. Проверьте подключение к сети.' };
  }
}

export async function importFromMalXml(xmlContent: string): Promise<ImportResult> {
  if (!xmlContent || !xmlContent.trim()) {
    return { success: false, error: 'Файл или текст экспорта пуст' };
  }

  // Strict 5 MB payload limit & executable file blocking
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (xmlContent.length > MAX_FILE_SIZE) {
    return { success: false, error: 'Размер загружаемого файла превышает допустимый лимит 5 МБ' };
  }

  // Check for malicious executable signatures
  if (xmlContent.startsWith('MZ') || xmlContent.startsWith('\x7fELF') || xmlContent.includes('<?php')) {
    return { success: false, error: 'Недопустимый формат файла. Разрешены только текстовые файлы экспорта (.xml)' };
  }

  try {
    const items: ImportRateItem[] = [];

    // Regex parsing for <anime> blocks
    const animeBlockRegex = /<anime>([\s\S]*?)<\/anime>/gi;
    let match: RegExpExecArray | null;

    while ((match = animeBlockRegex.exec(xmlContent)) !== null) {
      const block = match[1];

      const idMatch = block.match(/<series_animedb_id>(\d+)<\/series_animedb_id>/i);
      const scoreMatch = block.match(/<my_score>(\d+)<\/my_score>/i);
      const progressMatch = block.match(/<my_watched_episodes>(\d+)<\/my_watched_episodes>/i);
      const statusMatch = block.match(/<my_status>([^<]+)<\/my_status>/i);

      if (idMatch && idMatch[1]) {
        const shikimoriId = parseInt(idMatch[1], 10);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
        const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
        const status = mapMalStatus(statusMatch ? statusMatch[1] : 'Plan to Watch');

        items.push({
          shikimoriId,
          score: score && score > 0 ? score : null,
          progress,
          status,
        });
      }
    }

    if (items.length === 0) {
      return {
        success: false,
        error: 'В файле не найдено записей аниме. Убедитесь, что загружаете XML-экспорт списка MyAnimeList.',
      };
    }

    return await saveImportedRates(items);
  } catch (err: any) {
    console.error('MAL XML import error:', err);
    return { success: false, error: 'Ошибка разбора XML файла MyAnimeList.' };
  }
}
