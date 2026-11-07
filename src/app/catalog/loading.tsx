import React from 'react';

export default function CatalogLoading() {
  return (
    <div className="flex flex-col w-full py-8 px-margin md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto animate-pulse">
      {/* Title skeleton */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="w-48 h-10 rounded-xl bg-surface-container-high" />
        <div className="w-96 h-5 rounded-lg bg-surface-container" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
        <div className="w-48 h-11 rounded-xl bg-surface-container" />
        <div className="w-36 h-11 rounded-xl bg-surface-container" />
        <div className="w-36 h-11 rounded-xl bg-surface-container" />
        <div className="w-36 h-11 rounded-xl bg-surface-container" />
      </div>

      {/* Grid of anime cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl bg-surface-container-low overflow-hidden border border-outline-variant/10"
          >
            <div className="aspect-[2/3] w-full bg-surface-container-high" />
            <div className="p-3 flex flex-col gap-2">
              <div className="w-3/4 h-4 rounded bg-surface-container" />
              <div className="w-1/2 h-3 rounded bg-surface-container/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
