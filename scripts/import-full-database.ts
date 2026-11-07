/**
 * Скрипт автоматического пакетного импорта базы аниме (38 000+ тайтлов) в Supabase.
 *
 * Архитектурные правила оптимизации:
 * 1. Batching (пакетная загрузка по 100-200 записей): защита от таймаутов и лимитов сети.
 * 2. Экономия Supabase Storage: колонка poster_url хранит только прямые ссылки на CDN источников (MAL/Shikimori/AniList),
 *    что сохраняет 0 байт в Supabase Storage и не расходует бесплатный лимит.
 * 3. Текстовая база данных: в PostgreSQL сохраняются только метаданные, слаги и shikimori_id для авто-плееров.
 *
 * Запуск:
 *   node --env-file=.env.local -r esbuild-register scripts/import-full-database.ts
 *   или скомпилированным node-скриптом.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

const BATCH_SIZE = 150;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Ошибка: не заданы NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function importAnimeBatch(batch: any[]) {
  const { data, error } = await supabase
    .from('anime')
    .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false });

  if (error) {
    throw error;
  }
  return data;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

console.log('Скрипт импорта базы данных готов к запуску.');
