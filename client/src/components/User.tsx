import { FaUser } from "react-icons/fa";
import { mockStories } from "../mocks/stories";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";
import type { StoryBook } from "../types/story";

interface UserProps {
  isWalletConnected: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  profile?: UserProfile;
}

export function User({
  isWalletConnected,
  onConnectWallet,
  onDisconnectWallet,
  profile,
}: UserProps) {
  const nickname = profile?.nickname ?? "New user";
  const address = profile?.address ?? "";

  const navigate = useNavigate();

  const handleSelectStory = (story: StoryBook) => {
    navigate(`/story/${story.id}`, { state: { story } });
  };

  if (!isWalletConnected) {
    return (
      <div className="px-4 py-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
          <FaUser className="w-6 h-6 text-gray-300" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Connect your wallet</p>
          <p className="text-xs text-gray-400">
            To view your profile and posts, please connect your wallet first.
          </p>
        </div>
        <button
          className="
            mt-2
            px-4 py-2 
            rounded-full 
            text-sm font-medium 
            text-black
            btn-ip-yellow
            hover:brightness-110
            active:brightness-95
            transition
          "
          onClick={onConnectWallet}
        >
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${nickname}'s avatar`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <FaUser className="w-6 h-6 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold">{nickname}</span>
            <span className="text-xs text-gray-400 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
        <button
          className="px-3 py-1 text-xs rounded-full border border-gray-600 text-gray-100 hover:bg-gray-800 transition-colors"
          onClick={onDisconnectWallet}
        >
          Disconnect wallet
        </button>
      </div>
      <hr className="border-gray-800" />
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
    </div>
  );
}
