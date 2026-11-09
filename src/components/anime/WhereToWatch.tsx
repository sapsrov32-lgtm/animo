'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { WatchStatus } from '@/types';
import { setAnimeWatchStatus } from '@/app/actions/tracker';

export interface StreamingLink {
  id: number;
  url: string;
  site: string;
  icon?: string | null;
  color?: string | null;
}

export interface TrailerInfo {
  id: string;
  site: string;
}

interface WhereToWatchProps {
  animeId: string;
  shikimoriId?: number | null;
  anilistId?: number | null;
  titleRu?: string | null;
  titleEn?: string | null;
  isLoggedIn?: boolean;
  initialWatchStatus?: WatchStatus | null;
}

export function WhereToWatch({
  animeId,
  shikimoriId,
  anilistId,
  titleRu,
  titleEn,
  isLoggedIn = false,
  initialWatchStatus = null,
}: WhereToWatchProps) {
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [trailer, setTrailer] = useState<TrailerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStreamingList, setShowStreamingList] = useState(true);
  const [inPlan, setInPlan] = useState(initialWatchStatus === 'plan');
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // 3-second hard timeout so "Поиск..." never hangs
    const hardTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
      controller.abort();
    }, 3000);

    async function fetchLegalData() {
      try {
        const query = `
          query ($id: Int, $idMal: Int, $search: String) {
            Media(id: $id, idMal: $idMal, search: $search, type: ANIME) {
              id
              trailer {
                id
                site
              }
              externalLinks {
                id
                url
                site
                type
                icon
                color
              }
            }
          }
        `;

        const variables: Record<string, any> = {};
        if (anilistId) {
          variables.id = anilistId;
        } else if (shikimoriId) {
          variables.idMal = shikimoriId;
        } else if (titleEn || titleRu) {
          variables.search = titleEn || titleRu;
        } else {
          setLoading(false);
          clearTimeout(hardTimeout);
          return;
        }

        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }

        const json = await res.json();
        const media = json?.data?.Media;

        if (isMounted && media) {
          if (media.trailer && media.trailer.site === 'youtube' && media.trailer.id) {
            setTrailer({
              id: media.trailer.id.trim(),
              site: media.trailer.site,
            });
          }

          if (Array.isArray(media.externalLinks)) {
            const streaming = media.externalLinks
              .filter((l: any) => l.type === 'STREAMING')
              .map((l: any) => ({
                id: l.id,
                url: l.url,
                site: l.site,
                icon: l.icon,
                color: l.color,
              }));
            setLinks(streaming);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load legal streaming data:', err);
        }
      } finally {
        clearTimeout(hardTimeout);
        if (isMounted) setLoading(false);
      }
    }

    fetchLegalData();

    return () => {
      isMounted = false;
      clearTimeout(hardTimeout);
      controller.abort();
    };
  }, [anilistId, shikimoriId, titleEn, titleRu]);

  const handleAddToPlan = async () => {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setPlanLoading(true);
    const nextStatus: WatchStatus = inPlan ? 'now' : 'plan';
    try {
      const res = await setAnimeWatchStatus(animeId, nextStatus);
      if (!res?.error) {
        setInPlan(!inPlan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              links.length > 0
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-surface-container-high text-outline border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {links.length > 0 ? 'verified' : 'movie_off'}
            </span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Где смотреть официально
            </h2>
            <p className="font-body-xs text-xs text-outline">
              {loading
                ? 'Поиск легальных онлайн-кинотеатров...'
                : links.length > 0
                ? `${links.length} легальных сервисов для просмотра`
                : 'Пока нет легальных источников'}
            </p>
          </div>
        </div>

        {/* Action Button: "В планы" if no links, or "Смотреть (N)" toggle if links exist */}
        {!loading && links.length === 0 ? (
          <button
            type="button"
            onClick={handleAddToPlan}
            disabled={planLoading}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-95 ${
              inPlan
                ? 'bg-secondary text-on-secondary shadow-md'
                : 'bg-primary text-on-primary shadow-sm hover:brightness-110'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {inPlan ? 'bookmark_added' : 'bookmark_add'}
            </span>
            <span>{inPlan ? 'В планах' : 'В планы'}</span>
          </button>
        ) : links.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowStreamingList(!showStreamingList)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 border border-outline-variant/30 transition-all touch-manipulation active:scale-95"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">
              {showStreamingList ? 'expand_less' : 'open_in_new'}
            </span>
            <span>
              {showStreamingList ? 'Скрыть источники' : `Смотреть (${links.length})`}
            </span>
          </button>
        ) : null}
      </div>

      {/* Streaming Sources List (auto-expanded when links exist or toggled) */}
      {links.length > 0 && showStreamingList && (
        <div className="mt-2 pt-4 border-t border-outline-variant/20 flex flex-col gap-3 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="min-h-[48px] px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-center justify-between gap-3 text-on-surface group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {link.icon ? (
                    <div className="w-6 h-6 rounded-md overflow-hidden relative shrink-0 bg-black/20 flex items-center justify-center">
                      <Image
                        src={link.icon}
                        alt={link.site}
                        width={24}
                        height={24}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: link.color || '#6366f1' }}
                    >
                      {link.site.slice(0, 1)}
                    </div>
                  )}
                  <span className="font-title-card text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {link.site}
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px] shrink-0">
                  arrow_outward
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Official YouTube Trailer Embed (if available) */}
      {trailer && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-outline font-label-sm text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-primary text-[16px]">movie</span>
            <span>Официальный трейлер</span>
          </div>
          <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-outline-variant/30 shadow-xl">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.id}?rel=0&modestbranding=1`}
              title="Официальный трейлер"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </section>
  );
}
