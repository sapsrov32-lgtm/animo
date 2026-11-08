export default function RootLoading() {
  return (
    <div className="w-full min-h-screen flex flex-col gap-8 pb-16 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="w-full h-[400px] lg:h-[500px] bg-surface-container-low -mt-16 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop h-full flex flex-col justify-end pb-12 gap-4">
          <div className="w-32 h-6 rounded-full bg-surface-container-high" />
          <div className="w-3/4 max-w-xl h-12 rounded-2xl bg-surface-container-high" />
          <div className="w-1/2 max-w-md h-6 rounded-xl bg-surface-container-high" />
          <div className="flex gap-3 pt-2">
            <div className="w-40 h-11 rounded-full bg-surface-container-highest" />
            <div className="w-40 h-11 rounded-full bg-surface-container-highest" />
          </div>
        </div>
      </div>

      {/* Grid Carousel Skeleton */}
      <div className="max-w-[1440px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop w-full flex flex-col gap-4">
        <div className="w-48 h-8 rounded-xl bg-surface-container-low" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-2">
              <div className="w-full aspect-[2/3] rounded-xl bg-surface-container" />
              <div className="w-3/4 h-4 rounded bg-surface-container mt-1" />
              <div className="w-1/2 h-3 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
