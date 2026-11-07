import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const ITEMS_PER_SITEMAP = 5000;
const TOTAL_ANIME_APPROX = 39000;
const SITEMAP_CHUNKS = Math.ceil(TOTAL_ANIME_APPROX / ITEMS_PER_SITEMAP); // 8 chunks (0..7)

/**
 * Next.js динамически разбивает карту сайта на секции sitemap/0.xml ... sitemap/7.xml
 * и автоматически генерирует корневой индекс /sitemap.xml по стандартам Google и Яндекс.
 * Это позволяет охватить все 38 000+ страниц без таймаутов и перерасхода памяти.
 */
export async function generateSitemaps() {
  return Array.from({ length: SITEMAP_CHUNKS }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app';
  const supabase = await createClient();

  const from = id * ITEMS_PER_SITEMAP;
  const to = from + ITEMS_PER_SITEMAP - 1;

  const { data: animeList } = await supabase
    .from('anime')
    .select('slug, updated_at')
    .eq('is_published', true)
    .order('score', { ascending: false, nullsFirst: false })
    .range(from, to);

  const animePages: MetadataRoute.Sitemap = (animeList || []).map((anime) => ({
    url: `${baseUrl}/anime/${anime.slug}`,
    lastModified: anime.updated_at ? new Date(anime.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // В первый чанк также включаем ключевые статические разделы сайта
  if (id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/catalog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/calendar`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/recommend`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ];

    return [...staticPages, ...animePages];
  }

  return animePages;
}
