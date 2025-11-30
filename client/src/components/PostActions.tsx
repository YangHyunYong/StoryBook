import { FaRetweet } from "react-icons/fa";
import { IoHeartOutline, IoShareOutline } from "react-icons/io5";

interface PostActionsProps {
  reposts: number;
  likes: number;
  onRepostClick?: () => void;
  onLikeClick?: () => void;
  onShareClick?: () => void;
  stopPropagation?: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

export function PostActions({
  reposts,
  likes,
  onRepostClick,
  onLikeClick,
  onShareClick,
  stopPropagation = true,
}: PostActionsProps) {
  const wrapClick =
    (cb?: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) e.stopPropagation();
      cb?.();
    };

  return (
    <div
      className="
        flex items-center text-gray-500
        w-full
        gap-10 sm:gap-16 md:gap-24 lg:gap-32
      "
    >
      <button
        className="flex items-center gap-1 group w-20"
        onClick={wrapClick(onRepostClick)}
      >
        <div className="p-2 rounded-full group-active:bg-green-900/30 transition-colors">
          <FaRetweet className="w-[18px] h-[18px] group-active:text-green-500" />
        </div>
        <span className="text-[13px] font-mono w-4 text-right">
          {formatNumber(reposts)}
        </span>
      </button>

      <button
        className="flex items-center gap-1 group w-20"
        onClick={wrapClick(onLikeClick)}
      >
        <div className="p-2 rounded-full group-active:bg-pink-900/30 transition-colors">
          <IoHeartOutline className="w-[18px] h-[18px] group-active:text-pink-500" />
        </div>
        <span className="text-[13px] font-mono w-4 text-right">
          {formatNumber(likes)}
        </span>
      </button>

      <button
        className="flex items-center gap-1 group w-12"
        onClick={wrapClick(onShareClick)}
      >
        <div className="p-2 rounded-full group-active:bg-blue-900/30 transition-colors">
          <IoShareOutline className="w-[18px] h-[18px] group-active:text-[#1d9bf0]" />
        </div>
      </button>
    </div>
  );
}
