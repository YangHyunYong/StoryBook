import { useParams } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { PostActions } from "./PostActions";
import { formatRelativeTime } from "../utils/time";
import { mockPosts, mockThreadPosts } from "../mocks/posts";

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const post = mockPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="px-4 py-4">
        <p className="text-sm text-gray-400">Post not found.</p>
      </div>
    );
  }

  const threadForThisPost = mockThreadPosts.filter(
    (reply) => reply.parentId === post.id
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <article className="border-b border-gray-800 pb-3">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
            <FaUser className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px]">{post.nickname}</span>
              <span className="text-gray-500 text-[15px]">
                · {formatRelativeTime(post.timestamp)}
              </span>
            </div>
            <p className="whitespace-pre-wrap my-3 text-[15px] leading-normal">
              {post.content}
            </p>
            <PostActions reposts={post.reposts} likes={post.likes} />
          </div>
        </div>
      </article>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Thread</h2>
        {threadForThisPost.length === 0 ? (
          <p className="text-xs text-gray-500">
            No derivatives registered for this post yet.
          </p>
        ) : (
          threadForThisPost.map((reply) => (
            <article
              key={reply.id}
              className="border-b border-gray-800 -mx-4 px-4 py-3"
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <FaUser className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[14px]">
                      {reply.nickname}
                    </span>
                    <span className="text-gray-500 text-[14px]">
                      · {formatRelativeTime(reply.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap my-3 text-[15px] leading-normal">
                    {reply.content}
                  </p>
                  <PostActions reposts={reply.reposts} likes={reply.likes} />
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
