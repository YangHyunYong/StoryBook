import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PostActions } from "./PostActions";
import { formatRelativeTime } from "../utils/time";
import { mockPosts } from "../mocks/posts";

export function Feed() {
  const navigate = useNavigate();

  return (
    <div>
      <div>
        {mockPosts.map((post) => (
          <article
            key={post.id}
            className="border-b border-gray-800 px-4 py-3"
            onClick={() => navigate(`/post/${post.id}`)}
          >
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
                <p className="whitespace-pre-wrap mb-3 text-[15px] leading-normal">
                  {post.content}
                </p>
                <PostActions reposts={post.reposts} likes={post.likes} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
