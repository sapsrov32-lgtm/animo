import Image from 'next/image';

interface AiringCardProps {
  id: string;
  title: string;
  episode_info: string;
  episode_num: number;
  studio: string;
  timer: string;
  tags: string[];
  poster_url: string;
}

export function AiringCard({
  title,
  episode_info,
  episode_num,
  studio,
  timer,
  tags,
  poster_url,
}: AiringCardProps) {
  return (
    <div className="relative flex items-center gap-4 p-4 lg:p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-sm group">
      <div className="relative w-24 h-32 lg:w-28 lg:h-36 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
        {poster_url && (
          <Image
            src={poster_url}
            alt={title}
            fill
            sizes="120px"
            className="w-full h-full object-cover"
            unoptimized
          />
        )}
        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 font-label-sm text-[10px] text-tertiary">
          Эп. {episode_num}
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-0.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-label-sm text-label-sm text-outline truncate">{studio}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm shrink-0">
              <span className="material-symbols-outlined text-[13px]">timer</span>
              {timer}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="font-body-sm text-body-sm text-outline mt-0.5 truncate">
            {episode_info}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[11px] text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            aria-label="Напомнить о релизе"
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">notifications_none</span>
            <span className="hidden sm:inline">Напомнить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
