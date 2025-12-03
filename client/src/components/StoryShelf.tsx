import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { ipfsGatewayUrl } from "../utils/ipfs";
import type { StoryBook } from "../types/story";

// IPFS URL을 게이트웨이 URL로 변환
function convertToIpfsGatewayUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // 이미 HTTP/HTTPS URL이면 그대로 반환
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // ipfs:// 프로토콜이면 제거하고 CID만 추출
  if (url.startsWith("ipfs://")) {
    const cid = url.replace("ipfs://", "");
    return ipfsGatewayUrl(cid);
  }

  // CID만 있는 경우 (Qm... 또는 bafy... 등)
  // IPFS CID는 보통 Qm으로 시작하거나 bafy로 시작
  if (/^(Qm|bafy|bafkrei|bafkre)[a-zA-Z0-9]+$/.test(url)) {
    return ipfsGatewayUrl(url);
  }

  // 그 외의 경우 그대로 반환
  return url;
}

// 이미지 로딩 상태를 관리하는 컴포넌트
function StoryImage({
  imageUrl,
  alt,
  className,
}: {
  imageUrl?: string;
  alt: string;
  className: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center ml-3">
        <span className="text-xs text-zinc-500">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 ml-3 z-10">
          <div className="flex flex-col items-center gap-2 ml-[-12px]">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-yellow-400 rounded-full animate-spin" />
          </div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 ml-3">
          <span className="text-xs text-zinc-500">Failed to load</span>
        </div>
      )}
    </div>
  );
}

export function StoryShelf() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      if (!supabase) {
        setError("Supabase client is not configured");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("story")
          .select("id, parent_id, title, author, content, image_url, timestamp")
          .is("parent_id", null) // parent_id가 null인 것만 (루트 스토리만)
          .order("timestamp", { ascending: false }); // 최신순으로 정렬

        if (fetchError) {
          console.error("Failed to fetch stories:", fetchError);
          setError("Failed to load stories");
          return;
        }

        // Supabase 데이터를 StoryBook 타입으로 변환
        const mappedStories: StoryBook[] = (data || []).map((story) => ({
          id: Number(story.id),
          parentId: story.parent_id ? Number(story.parent_id) : null,
          title: story.title,
          author: story.author,
          content: story.content,
          imageUrl: story.image_url || undefined,
          timestamp: Number(story.timestamp),
        }));

        setStories(mappedStories);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("An error occurred while loading stories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleSelectStory = (story: StoryBook) => {
    navigate(`/story/${story.id}`, { state: { story } });
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-zinc-400">Loading stories...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  if (stories.length === 0) {
    return (
      <section className="flex flex-col gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-zinc-400">No stories found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
      <div className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
        {stories.map((story) => (
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
                <div className="relative h-full w-full bg-zinc-800">
                  <StoryImage
                    imageUrl={convertToIpfsGatewayUrl(story.imageUrl)}
                    alt={story.title}
                    className="h-full object-cover ml-3 pr-3"
                  />
                </div>
              </div>
            </div>
            <div className="ml-3 mt-3 max-w-28 text-center md:max-w-32">
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
