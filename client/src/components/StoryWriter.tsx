import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import axios from "axios";
import { findStoryById } from "../utils/story";
import { LicenseSelectionModal } from "./LicenseSelectModal";
import type { StoryBook } from "../types/story";
import type { LicenseSelectionResult } from "../types/license";
import type { UserProfile } from "../types/user";

// API 기본 URL 설정 (환경 변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type LocationState = {
  parent?: StoryBook;
};

interface StoryWriterProps {
  profile: UserProfile | null;
}

export function StoryWriter({ profile }: StoryWriterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const state = location.state as LocationState | null;
  const parentIdParam = params.id ? Number(params.id) : undefined;

  let parent: StoryBook | undefined = state?.parent;
  if (!parent && parentIdParam != null) {
    parent = findStoryById(parentIdParam);
  }

  const hasParentContext = state?.parent != null || parentIdParam != null;
  const isRoot = !parent && !hasParentContext;

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="text-center text-sm text-zinc-400">
          <p>You need to connect your wallet and set up your profile first.</p>
        </div>
      </div>
    );
  }

  if (!parent && hasParentContext && parentIdParam != null) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="text-center text-sm text-zinc-400">
          <p>Could not find the Story to derive from.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
          >
            Back to Story Shelf
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmLicenses = (result: LicenseSelectionResult) => {
    setIsLicenseModalOpen(false);
    console.log(isRoot ? "new root story" : "new derivative story", {
      parentId: parent?.id ?? null,
      title,
      content,
    });
    console.log("license config:", result);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;

    try {
      setIsGeneratingImage(true);

      // 이미지 생성 API 호출 주석 처리
      // const response = await axios.post(
      //   `${API_BASE_URL}/stability/generate`,
      //   { prompt: content },
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      // if (response.data?.imageUrl) {
      //   setImageUrl(response.data.imageUrl);

      //   // IPFS에 업로드할 이미지 URL
      //   console.log(response.data.imageUrl);
      // }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Failed to generate image:",
          error.response?.data || error.message
        );
      } else {
        console.error("Error calling stability API:", error);
      }
    } finally {
      setIsGeneratingImage(false);
      // After image generation request, open the license selection modal
      setIsLicenseModalOpen(true);
    }
  };

  const handleCancel = () => {
    if (isRoot) {
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-1 flex-col w-full h-full overflow-x-hidden">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full h-[90vh] px-2 md:px-4 lg:px-8">
          <div className="absolute inset-x-6 bottom-0 h-4 translate-y-5 rounded-full bg-black/80 blur-2xl pointer-events-none" />
          <div className="absolute inset-y-4 inset-x-4 md:inset-y-6 md:inset-x-6 rounded-[26px] bg-linear-to-br from-zinc-950 to-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.95)]" />
          <div className="absolute inset-y-5 inset-x-5 md:inset-y-7 md:inset-x-7 rounded-[22px] bg-zinc-950 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="pointer-events-none absolute inset-y-10 right-4 w-[5px] rounded-sm bg-zinc-800 shadow-[-3px_0_4px_rgba(0,0,0,0.5)]" />
            <div className="pointer-events-none absolute inset-y-9 right-2.5 w-[5px] rounded-sm bg-zinc-700 shadow-[-3px_0_4px_rgba(0,0,0,0.45)]" />
            <div className="absolute inset-1.5 rounded-[18px] bg-zinc-950/95 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-8 left-0 w-12 bg-linear-to-r from-zinc-900 via-zinc-950 to-transparent shadow-[inset_-10px_0_14px_rgba(0,0,0,0.6)]" />
              <div className="pointer-events-none absolute inset-y-8 right-3 w-px bg-zinc-600/70" />
              <div className="pointer-events-none absolute bottom-4 left-8 right-4 h-px bg-linear-to-r from-zinc-700 via-zinc-600 to-zinc-700 opacity-70" />
              <div className="relative flex h-full w-full pl-8 pr-8 pt-8 pb-10 md:pl-16 md:pr-14 md:pt-10">
                <div className="relative flex-1 flex flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex flex-col text-[10px] text-zinc-400">
                      <span className="uppercase tracking-[0.2em]">
                        {isRoot
                          ? "Writing Original Story"
                          : "Writing Derivative"}
                      </span>
                      {!isRoot && parent && (
                        <span className="max-w-[260px] truncate text-xs text-zinc-200">
                          of {parent.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative mb-4 flex items-center justify-between text-[10px] text-zinc-500 md:mb-5 md:text-[11px]">
                    <span className="tracking-wide">
                      {isRoot ? "Write Original" : "Write Next"}
                    </span>
                    <span className="truncate max-w-[65%] text-right text-zinc-400">
                      {isRoot
                        ? title || "New Story"
                        : parent?.title ?? "Derived from"}
                    </span>
                  </div>
                  <div className="relative mb-4 h-px w-full bg-linear-to-r from-zinc-700 via-zinc-800 to-zinc-700" />
                  <div className="relative flex-1 min-h-0 flex flex-col">
                    <form
                      id="story-writer-form"
                      onSubmit={handleSubmit}
                      className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 text-sm leading-relaxed text-zinc-100 md:text-base"
                    >
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#fde68a]"
                          placeholder={
                            isRoot
                              ? "Enter the title of your story"
                              : "Enter the title of your derivative story"
                          }
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="mb-1 block text-xs text-zinc-400">
                          Content
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[220px] flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#fde68a]"
                          placeholder={
                            isRoot
                              ? "Write your story here"
                              : "Write your derivative story here"
                          }
                        />
                      </div>
                    </form>
                    {imageUrl && (
                      <div className="mb-1 text-[10px] text-zinc-400">
                        Story illustration generated.
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800 md:px-4"
                      >
                        <span className="sm:inline">←</span>
                      </button>
                      <button
                        type="submit"
                        form="story-writer-form"
                        disabled={
                          !title.trim() || !content.trim() || isGeneratingImage
                        }
                        className="
                          px-4 py-1.5 rounded-full text-xs font-medium text-black
                          btn-ip-yellow
                          hover:brightness-110 active:brightness-95
                          transition
                          disabled:opacity-40 disabled:cursor-not-allowed
                        "
                      >
                        <span className="sm:inline">
                          {isGeneratingImage ? "Generating..." : "Register"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LicenseSelectionModal
        isOpen={isLicenseModalOpen}
        postTitle={title}
        postText={content}
        onClose={() => setIsLicenseModalOpen(false)}
        onConfirm={handleConfirmLicenses}
        profile={profile}
        isRoot={isRoot}
      />
    </div>
  );
}
