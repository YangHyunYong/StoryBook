import { FaUser } from "react-icons/fa";
import { PostActions } from "./PostActions";
import type { UserProfile } from "../types/user";
import { formatRelativeTime } from "../utils/time";
import { mockUserPosts } from "../mocks/posts";

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
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-200">Posts</h2>
        <div>
          {mockUserPosts.map((post) => (
            <article
              key={post.id}
              className="border-b border-gray-800 -mx-4 px-4 py-3"
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <FaUser className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px]">
                      {post.nickname}
                    </span>
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
      </section>
    </div>
  );
}
