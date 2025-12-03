import type { StoryBook } from "../types/story";
import { findStoryById, findChildrenStories } from "../utils/story";

type StoryDerivativesViewProps = {
  story?: StoryBook;
  storyId?: number;
  onSelectDerivative: (id: number) => void;
};

export function StoryDerivativesView({
  story,
  storyId,
  onSelectDerivative,
}: StoryDerivativesViewProps) {
  const baseStory =
    story ?? (storyId != null ? findStoryById(storyId) : undefined);

  if (!baseStory) {
    return (
      <div className="relative flex h-[78%] items-center justify-center text-sm text-zinc-400">
        <p>Could not find this Story.</p>
      </div>
    );
  }

  const derivatives = findChildrenStories(baseStory.id);

  if (derivatives.length === 0) {
    return (
      <div className="relative flex h-[78%] flex-col gap-3 overflow-y-auto pr-1 text-sm text-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Derivative Stories
        </p>
        <p className="text-xs text-zinc-400 md:text-sm">
          There are no derivative NFTs from this Story yet. Click Write Next to
          create the first derivative Story.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[78%] flex-col gap-3 overflow-y-auto pr-1 text-[11px] leading-relaxed text-zinc-100 md:text-sm">
      <p className="text-xs text-zinc-400 md:text-sm">
        These are NFT images derived from this Story. Select an image you like
        to read its derivative Story.
      </p>
      <div className="mt-2 grid grid-cols-3 gap-0 md:grid-cols-4 md:gap-4">
        {derivatives.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelectDerivative(d.id)}
            className="group flex flex-col items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 hover:border-emerald-500/80 hover:bg-zinc-900"
          >
            <div className="relative w-full aspect-3/4 overflow-hidden rounded-md">
              <img
                src={
                  d.imageUrl ??
                  "https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg"
                }
                alt={d.title}
                className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.03]"
              />
            </div>
            <p className="line-clamp-2 w-full text-left text-[11px] font-medium text-zinc-100 md:text-xs">
              {d.title}
            </p>
            <p className="w-full text-left text-[10px] text-zinc-400">
              {d.author}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
