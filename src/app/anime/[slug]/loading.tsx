import React from 'react';

export default function AnimeDetailsLoading() {
  return (
    <div className="flex flex-col w-full pb-16 animate-pulse">
      {/* Backdrop Ambient Hero Skeleton */}
      <div className="relative w-full -mt-16 overflow-hidden h-[360px] md:h-[440px] bg-surface-container-high/40">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 -mt-36 md:-mt-48 px-margin md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl">
          
          {/* Left Column: Poster Skeleton */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md">
            <div className="aspect-[2/3] w-full rounded-2xl bg-surface-container-high shadow-2xl border border-outline-variant/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-high via-surface-container to-surface-container-high/60" />
            </div>

            {/* Metric Bento Skeleton */}
            <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="h-16 rounded-lg bg-surface-container" />
              <div className="h-16 rounded-lg bg-surface-container" />
            </div>
          </div>

          {/* Right Column: Titles, Badges, Tracker & Synopsis */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-space-md">
            {/* Season pill & title */}
            <div className="flex flex-col gap-2.5">
              <div className="w-24 h-5 rounded-full bg-surface-container-high" />
              <div className="w-3/4 h-10 md:h-12 rounded-xl bg-surface-container-high" />
              <div className="w-1/2 h-6 rounded-lg bg-surface-container" />
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2 py-1">
              <div className="w-24 h-8 rounded-xl bg-surface-container-high" />
              <div className="w-28 h-8 rounded-xl bg-surface-container-high" />
              <div className="w-20 h-8 rounded-xl bg-surface-container-high" />
              <div className="w-32 h-8 rounded-xl bg-surface-container-high" />
            </div>

            {/* Tracker Skeleton */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-4">
              <div className="w-32 h-5 rounded bg-surface-container" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 rounded-xl bg-surface-container" />
                <div className="h-12 rounded-xl bg-surface-container" />
                <div className="h-12 rounded-xl bg-surface-container" />
              </div>
            </div>

            {/* Synopsis Skeleton */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
              <div className="w-28 h-6 rounded bg-surface-container" />
              <div className="w-full h-4 rounded bg-surface-container/80" />
              <div className="w-full h-4 rounded bg-surface-container/80" />
              <div className="w-4/5 h-4 rounded bg-surface-container/80" />
            </div>

            {/* Player Skeleton */}
            <div className="w-full aspect-video rounded-3xl bg-surface-container-high/60 border border-outline-variant/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
