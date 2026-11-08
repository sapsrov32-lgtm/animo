import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 86400; // Кэшировать на 24 часа для мгновенной отдачи роботам Яндекса и Google

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animo-virid.vercel.app';

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
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    // Выгружаем слаги всех опубликованных тайтлов (исключая 18+ и неопубликованные)
    const { data: animeList, error } = await supabase
      .from('anime')
      .select('slug, updated_at')
      .eq('is_published', true)
      .eq('is_adult', false)
      .order('popularity', { ascending: false, nullsFirst: false })
      .limit(45000);

    if (error) {
      console.error('Supabase sitemap error:', error);
      return staticPages;
    }

    const animePages: MetadataRoute.Sitemap = (animeList || []).map((anime) => ({
      url: `${baseUrl}/anime/${anime.slug}`,
      lastModified: anime.updated_at ? new Date(anime.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...animePages];
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return staticPages;
  }
}
