import { useState } from "react";
import { LicenseSelectionModal } from "./LicenseSelectModal";
import type { LicenseSelectionResult } from "../types/license";

export function Compose() {
  const [content, setContent] = useState("");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const handleClickPost = () => {
    if (!content.trim()) return;
    setIsLicenseModalOpen(true);
  };

  const handleConfirmLicenses = (result: LicenseSelectionResult) => {
    setIsLicenseModalOpen(false);
    console.log("post content:", content);
    console.log("license config:", result);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">New Post</h2>
        <button
          onClick={handleClickPost}
          disabled={!content.trim()}
          className={`
            px-4 py-2 rounded-full text-sm font-medium text-black
            btn-ip-yellow
            hover:brightness-110 active:brightness-95
            transition
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          Post
        </button>
      </div>
      <textarea
        className="w-full min-h-40 rounded-xl bg-black border border-gray-700 p-3 text-sm resize-none focus:outline-none focus:border-sky-500"
        placeholder="What's happening?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <LicenseSelectionModal
        isOpen={isLicenseModalOpen}
        postText={content}
        onClose={() => setIsLicenseModalOpen(false)}
        onConfirm={handleConfirmLicenses}
      />
    </div>
  );
}
