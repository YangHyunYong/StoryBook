import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import type { StoryBook } from "../types/story";
import { StoryDerivativesView } from "./StoryDerivativesView";

async function computePageNumber(
  story: StoryBook,
  getParent: (id: number) => Promise<StoryBook | null>
): Promise<number> {
  let depth = 1;
  let current: StoryBook | undefined = story;

  while (current.parentId != null) {
    const parent = await getParent(current.parentId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }

  return depth;
}

export function StoryReader() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation() as { state?: { openDerivatives?: boolean } };

  const storyId = params.id ? Number(params.id) : NaN;
  const [story, setStory] = useState<StoryBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      if (Number.isNaN(storyId) || !supabase) {
        setIsLoading(false);
        setError("Invalid story ID");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("story")
          .select("id, parent_id, title, author, content, image_url, timestamp")
          .eq("id", storyId)
          .single();

        if (fetchError) {
          console.error("Failed to fetch story:", fetchError);
          setError("Story not found");
          return;
        }

        if (!data) {
          setError("Story not found");
          return;
        }

        const mappedStory: StoryBook = {
          id: Number(data.id),
          parentId: data.parent_id ? Number(data.parent_id) : null,
          title: data.title,
          author: data.author,
          content: data.content,
          imageUrl: data.image_url || undefined,
          timestamp: Number(data.timestamp),
        };
        setStory(mappedStory);
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("An error occurred while loading the story");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="text-center text-sm text-zinc-400">
          <p>Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="text-center text-sm text-zinc-400">
          <p>이 Story를 찾을 수 없어요.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
          >
            Story Shelf로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <StoryReaderInner
      key={story.id}
      story={story}
      openDerivativesInitially={!!location.state?.openDerivatives}
    />
  );
}

type StoryReaderInnerProps = {
  story: StoryBook;
  openDerivativesInitially: boolean;
};

function StoryReaderInner({
  story,
  openDerivativesInitially,
}: StoryReaderInnerProps) {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<"read" | "derivatives">(
    openDerivativesInitially ? "derivatives" : "read"
  );
  const [parent, setParent] = useState<StoryBook | null>(null);
  const [children, setChildren] = useState<StoryBook[]>([]);
  const [pageNumber, setPageNumber] = useState(1);

  const isRoot = story.parentId === null;

  useEffect(() => {
    const fetchRelatedStories = async () => {
      if (!supabase) {
        return;
      }

      try {
        // 부모 스토리 가져오기
        if (story.parentId !== null) {
          const { data: parentData } = await supabase
            .from("story")
            .select(
              "id, parent_id, title, author, content, image_url, timestamp"
            )
            .eq("id", story.parentId)
            .single();

          if (parentData) {
            setParent({
              id: Number(parentData.id),
              parentId: parentData.parent_id
                ? Number(parentData.parent_id)
                : null,
              title: parentData.title,
              author: parentData.author,
              content: parentData.content,
              imageUrl: parentData.image_url || undefined,
              timestamp: Number(parentData.timestamp),
            });
          }
        }

        // 자식 스토리 가져오기
        const { data: childrenData } = await supabase
          .from("story")
          .select("id, parent_id, title, author, content, image_url, timestamp")
          .eq("parent_id", story.id)
          .order("timestamp", { ascending: false });

        if (childrenData) {
          const mappedChildren: StoryBook[] = childrenData.map((child) => ({
            id: Number(child.id),
            parentId: child.parent_id ? Number(child.parent_id) : null,
            title: child.title,
            author: child.author,
            content: child.content,
            imageUrl: child.image_url || undefined,
            timestamp: Number(child.timestamp),
          }));
          setChildren(mappedChildren);
        }

        // 페이지 번호 계산
        const getParent = async (id: number): Promise<StoryBook | null> => {
          if (!supabase) return null;

          const { data } = await supabase
            .from("story")
            .select(
              "id, parent_id, title, author, content, image_url, timestamp"
            )
            .eq("id", id)
            .single();

          if (!data) return null;

          return {
            id: Number(data.id),
            parentId: data.parent_id ? Number(data.parent_id) : null,
            title: data.title,
            author: data.author,
            content: data.content,
            imageUrl: data.image_url || undefined,
            timestamp: Number(data.timestamp),
          };
        };

        const page = await computePageNumber(story, getParent);
        setPageNumber(page);
      } catch (err) {
        console.error("Error fetching related stories:", err);
      }
    };

    fetchRelatedStories();
  }, [story]);

  const hasDerivatives = children.length > 0;

  const setCurrentViewMode = (mode: "read" | "derivatives") => {
    setViewMode(mode);
  };

  const handlePrev = () => {
    if (viewMode === "derivatives") {
      setCurrentViewMode("read");
      return;
    }

    if (viewMode === "read" && story.parentId !== null) {
      navigate(`/story/${story.parentId}`, {
        state: { openDerivatives: true },
      });
    }
  };

  const handleNext = () => {
    if (viewMode === "read") {
      if (hasDerivatives) {
        setCurrentViewMode("derivatives");
        return;
      }
      navigate(`/story/${story.id}/write`, {
        state: { parent: story },
      });
    }
  };

  const handleSelectDerivative = (childId: number) => {
    navigate(`/story/${childId}`);
  };

  const showPrevButton = viewMode === "derivatives" || story.parentId !== null;
  const showNextButton = viewMode === "read";

  return (
    <div className="flex flex-1 flex-col w-full h-full overflow-x-hidden overflow-y-hidden">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full h-[90vh] px-2 md:px-4 lg:px-8">
          <div className="absolute inset-x-6 bottom-0 h-4 translate-y-5 rounded-full bg-black/80 blur-2xl pointer-events-none" />
          <div className="absolute inset-y-4 inset-x-4 md:inset-y-6 md:inset-x-6 rounded-[26px] bg-linear-to-br from-zinc-950 to-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-y-5 inset-x-5 md:inset-y-7 md:inset-x-7 rounded-[22px] bg-zinc-950 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-1.5 rounded-[18px] bg-zinc-950/95 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-8 left-0 w-5 bg-linear-to-r from-zinc-900 via-zinc-950 to-transparent shadow-[inset_-10px_0_14px_rgba(0,0,0,0.6)]" />
              <div className="pointer-events-none absolute inset-y-8 right-3 w-px bg-zinc-600/70" />
              <div className="pointer-events-none absolute bottom-4 left-8 right-4 h-px bg-linear-to-r from-zinc-700 via-zinc-600 to-zinc-700 opacity-70" />
              <div className="relative flex h-full w-full pl-8 pr-8 pt-8 pb-10 md:pl-20 md:pr-14 md:pt-10">
                <div className="relative flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-[10px] text-zinc-100 hover:bg-zinc-800 md:text-xs"
                    >
                      <span>←</span>
                      <span>Back to Shelf</span>
                    </button>
                    {!isRoot && parent && (
                      <span className="hidden md:inline-flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="rounded-full border border-zinc-700/60 px-2 py-0.5">
                          From: {parent.title}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="relative mb-4 flex items-center justify-between text-[10px] text-zinc-500 md:mb-5 md:text-[11px]">
                    <span className="tracking-wide">
                      {viewMode === "read"
                        ? `Page ${pageNumber}`
                        : `Page ${pageNumber + 1}`}
                    </span>
                    <span className="truncate max-w-[65%] text-right text-zinc-400">
                      {story.title}
                    </span>
                  </div>
                  <div className="relative mb-4 h-px w-full bg-linear-to-r from-zinc-700 via-zinc-800 to-zinc-700" />
                  {viewMode === "read" ? (
                    <div className="relative flex h-[78%] flex-col gap-3 overflow-y-auto pr-1 text-sm leading-relaxed text-zinc-100 md:text-base">
                      <p className="font-semibold text-zinc-50 md:text-lg">
                        {story.title}
                      </p>
                      <p className="text-xs text-zinc-400 md:text-sm">
                        by {story.author}
                      </p>
                      {!isRoot && parent && (
                        <p className="text-[11px] text-zinc-500 md:text-xs">
                          Derived from:{" "}
                          <span className="text-zinc-200">{parent.title}</span>
                        </p>
                      )}
                      {story.imageUrl && (
                        <div className="relative w-full rounded-lg">
                          <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      <p className="whitespace-pre-line">{story.content}</p>
                    </div>
                  ) : (
                    <StoryDerivativesView
                      story={story}
                      storyId={story.id}
                      onSelectDerivative={handleSelectDerivative}
                    />
                  )}
                  {showPrevButton && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute bottom-0 left-0 inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800 md:px-4"
                    >
                      <span className="sm:inline">←</span>
                    </button>
                  )}
                  {showNextButton && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800 md:px-4"
                    >
                      <span className="sm:inline">→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
