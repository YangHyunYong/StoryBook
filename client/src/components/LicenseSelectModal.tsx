import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LicenseType, LicenseSelectionResult } from "../types/license";

interface LicenseSelectionModalProps {
  isOpen: boolean;
  postText: string;
  onClose: () => void;
  onConfirm: (result: LicenseSelectionResult) => void;
}

const COMMERCIAL_TYPES: LicenseType[] = ["COMMERCIAL_USE", "COMMERCIAL_REMIX"];

const LICENSE_OPTIONS: {
  type: LicenseType;
  title: string;
  description: string;
}[] = [
  {
    type: "OPEN_USE",
    title: "Open Use",
    description:
      "For free distribution and remixing without restriction, revenue, or attribution",
  },
  {
    type: "NON_COMMERCIAL_REMIX",
    title: "Non-Commercial Remix",
    description:
      "Anyone can use your work to generate their own, non-commercial project",
  },
  {
    type: "COMMERCIAL_USE",
    title: "Commercial Use",
    description:
      "Allow others to use your work at the economic terms you define",
  },
  {
    type: "COMMERCIAL_REMIX",
    title: "Commercial Remix",
    description:
      "Let others remix your work for while you get credit & revenue",
  },
];

export function LicenseSelectionModal({
  isOpen,
  postText,
  onClose,
  onConfirm,
}: LicenseSelectionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<LicenseType[]>([]);
  const navigate = useNavigate();

  const [commercialUsePrice, setCommercialUsePrice] = useState("");
  const [commercialUseShare, setCommercialUseShare] = useState("");
  const [commercialRemixPrice, setCommercialRemixPrice] = useState("");
  const [commercialRemixShare, setCommercialRemixShare] = useState("");

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setSelected([]);
    setCommercialUsePrice("");
    setCommercialUseShare("");
    setCommercialRemixPrice("");
    setCommercialRemixShare("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const toggleLicense = (type: LicenseType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const hasCommercialSelected = selected.some((t) =>
    COMMERCIAL_TYPES.includes(t)
  );

  const totalSteps = hasCommercialSelected ? 3 : 2;

  const currentStepForDisplay = (() => {
    if (!hasCommercialSelected) {
      return step === 1 ? 1 : 2;
    }
    return step;
  })();

  const titleForStep = (() => {
    if (step === 1) return "Add a license";
    if (hasCommercialSelected && step === 2) return "Pricing & Royalties";
    return "Review and register";
  })();

  const handleNextFromStep1 = () => {
    if (selected.length === 0) return;

    if (hasCommercialSelected) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const canConfirmStep2 = (() => {
    const needUse = selected.includes("COMMERCIAL_USE");
    const needRemix = selected.includes("COMMERCIAL_REMIX");

    if (needUse) {
      if (!commercialUsePrice.trim()) return false;
    }
    if (needRemix) {
      if (!commercialRemixPrice.trim() || !commercialRemixShare.trim())
        return false;
    }
    return true;
  })();

  const handleNextFromStep2 = () => {
    if (!canConfirmStep2) return;
    setStep(3);
  };

  const handlePost = () => {
    const result: LicenseSelectionResult = {
      licenses: selected,
    };

    if (selected.includes("COMMERCIAL_USE")) {
      result.commercialUse = {
        priceIp: Number(commercialUsePrice),
        revenueSharePct: Number(commercialUseShare),
      };
    }

    if (selected.includes("COMMERCIAL_REMIX")) {
      result.commercialRemix = {
        priceIp: Number(commercialRemixPrice),
        revenueSharePct: Number(commercialRemixShare),
      };
    }

    onConfirm(result);
    resetState();
    navigate("/");
  };

  const isReviewStep = step === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-row items-center gap-2">
            <h2 className="text-base font-semibold">{titleForStep}</h2>
            <p className="text-[11px] text-gray-500">
              Step {currentStepForDisplay} of {totalSteps}
            </p>
          </div>
          <button
            className="px-2 py-1 rounded-full text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            X
          </button>
        </div>
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              You can add up to 5 licenses to this asset
            </p>
            <div className="space-y-2">
              {LICENSE_OPTIONS.map((option) => {
                const isActive = selected.includes(option.type);
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => toggleLicense(option.type)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition
                      ${
                        isActive
                          ? "border-yellow-400/80 bg-yellow-500/10"
                          : "border-gray-700 hover:bg-gray-800/60"
                      }`}
                  >
                    <div className="font-semibold text-sm">{option.title}</div>
                    <div className="text-[11px] text-gray-400">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                className="
                  px-4 py-1.5 rounded-full text-xs font-medium text-black
                  btn-ip-yellow
                  hover:brightness-110 active:brightness-95
                  transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
                disabled={selected.length === 0}
                onClick={handleNextFromStep1}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {step === 2 && hasCommercialSelected && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Enter the price and revenue share for each license. Licenses are
              single use only. Buyers will need to purchase a new license for
              each additional use.
            </p>

            {selected.includes("COMMERCIAL_USE") && (
              <div className="space-y-2 border border-gray-800 rounded-xl p-3">
                <h3 className="text-sm font-semibold mb-1">
                  Commercial Use License
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300">
                    License price (in IP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg bg-black border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Enter license price"
                    value={commercialUsePrice}
                    onChange={(e) => setCommercialUsePrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300">
                    Revenue share (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-lg bg-black border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500 text-gray-500"
                    placeholder="Enter revenue share"
                    disabled
                    readOnly
                  />
                  <p className="text-[10px] text-gray-500">
                    Revenue share for Commercial Use is fixed.
                  </p>
                </div>
              </div>
            )}
            {selected.includes("COMMERCIAL_REMIX") && (
              <div className="space-y-2 border border-gray-800 rounded-xl p-3">
                <h3 className="text-sm font-semibold mb-1">
                  Commercial Remix License
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300">
                    License price (in IP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg bg-black border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Enter license price"
                    value={commercialRemixPrice}
                    onChange={(e) => setCommercialRemixPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300">
                    Revenue share (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-lg bg-black border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Enter revenue share"
                    value={commercialRemixShare}
                    onChange={(e) => setCommercialRemixShare(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button
                className="px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="
                    px-4 py-1.5 rounded-full text-xs font-medium text-black
                    btn-ip-yellow
                    hover:brightness-110 active:brightness-95
                    transition
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                  disabled={!canConfirmStep2}
                  onClick={handleNextFromStep2}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        {isReviewStep && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Here’s an overview of your registration.
            </p>
            <div className="space-y-1 border border-gray-800 rounded-xl p-3">
              <div className="text-[11px] text-gray-400 mb-1">Your post</div>
              <p className="text-sm text-gray-100 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {postText}
              </p>
            </div>
            <div className="space-y-2 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Licenses ({selected.length})
                </span>
              </div>
              <ul className="space-y-1 text-xs text-gray-200">
                {LICENSE_OPTIONS.filter((option) =>
                  selected.includes(option.type)
                ).map((option) => (
                  <li key={option.type} className="font-semibold">
                    {option.title}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between pt-2">
              <button
                className="px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
                onClick={() => {
                  if (hasCommercialSelected) {
                    setStep(2);
                  } else {
                    setStep(1);
                  }
                }}
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  className="
                    px-4 py-1.5 rounded-full text-xs font-medium text-black
                    btn-ip-yellow
                    hover:brightness-110 active:brightness-95
                    transition
                  "
                  onClick={handlePost}
                >
                  Get some $IP to Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
