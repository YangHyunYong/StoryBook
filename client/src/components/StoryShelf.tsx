import { useNavigate } from "react-router-dom";
import { mockStories } from "../mocks/stories";
import type { StoryBook } from "../types/story";

export function StoryShelf() {
  const navigate = useNavigate();

  const handleSelectStory = (story: StoryBook) => {
    navigate(`/story/${story.id}`, { state: { story } });
  };

  return (
    <section className="flex flex-col gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
      <div className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
        {mockStories.map((story) => (
          <article
            key={story.id}
            onClick={() => handleSelectStory(story)}
            className="group cursor-pointer"
          >
            <div className="relative mx-auto h-32 w-24 md:h-36 md:w-28">
              <div className="absolute inset-x-3 bottom-0 h-2 translate-y-2 rounded-full bg-black/40 blur-md" />
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg bg-zinc-200/90 shadow-sm" />
              <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg bg-zinc-100/95 shadow-sm" />
              <div className="relative h-full w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-[0_8px_18px_rgba(0,0,0,0.6)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_26px_rgba(0,0,0,0.75)]">
                <div className="absolute inset-y-1 left-0 w-3 bg-black/35">
                  <div className="h-full w-full border-r border-black/60" />
                </div>
                <div className="h-full w-full bg-zinc-800">
                  {
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="h-full object-cover ml-3"
                    />
                  }
                </div>
              </div>
            </div>
            <div className="mt-3 max-w-28 text-center md:max-w-32">
              <h3 className="line-clamp-2 text-[11px] font-medium text-zinc-100 md:text-xs">
                {story.title}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
