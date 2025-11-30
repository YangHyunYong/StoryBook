import { useState, type ChangeEvent, type FormEvent } from "react";

interface ProfileSetupModalProps {
  isOpen: boolean;
  address: string | null;
  onCancel: () => void;
  onSave: (data: { nickname: string; avatarDataUrl?: string }) => void;
}

export function ProfileSetupModal({
  isOpen,
  address,
  onCancel,
  onSave,
}: ProfileSetupModalProps) {
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();

  if (!isOpen || !address) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    onSave({
      nickname: nickname.trim(),
      avatarDataUrl: avatarPreview,
    });

    resetForm();
  };

  const resetForm = () => {
    setNickname("");
    setAvatarPreview(undefined);
  };

  const handleCancelClick = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl">
        <h2 className="text-base font-semibold mb-3">Set up your profile</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">Add</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <div className="text-[11px] text-gray-500">
              Optional profile image.
              <br />
              Square images look best.
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300">Nickname</label>
            <input
              type="text"
              className="
                w-full rounded-xl bg-black 
                border border-gray-700 
                px-3 py-2 text-sm
                focus:outline-none focus:border-sky-500
              "
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-400">Wallet</span>
            <div className="text-xs font-mono text-gray-500 bg-black/40 border border-gray-800 rounded-xl px-3 py-2 break-all">
              {address}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
              onClick={handleCancelClick}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                px-4 py-1.5 rounded-full text-xs font-medium text-black
                btn-ip-yellow
                hover:brightness-110 active:brightness-95
                transition
                disabled:opacity-40
                disabled:cursor-not-allowed
                disabled:hover:brightness-100
                disabled:active:brightness-100
              "
              disabled={!nickname.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
