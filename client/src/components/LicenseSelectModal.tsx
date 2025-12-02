import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerIpAsset } from "../services/story/registerIpAsset";
import type { IpMetadata } from "@story-protocol/core-sdk";
import type { NftMetadata } from "../types/ipAsset";

import { createStoryClient } from "../utils/storyClient";
import { PILFlavor, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { toHex } from "viem";
import type { LicenseType, LicenseSelectionResult } from "../types/license";
import type { UserProfile } from "../types/user";

interface LicenseSelectionModalProps {
  isOpen: boolean;
  postTitle: string;
  postText: string;
  onClose: () => void;
  onConfirm: (result: LicenseSelectionResult) => void;
  isRoot: boolean;
  profile: UserProfile;
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
  postTitle,
  postText,
  onClose,
  onConfirm,
  isRoot,
  profile,
}: LicenseSelectionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<LicenseType[]>([]);
  const [isPosting, setIsPosting] = useState(false);
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

  const handlePost = async () => {
    try {
      setIsPosting(true);

      const ipMetadata: IpMetadata = {
        title: postTitle,
        description: postText,
        image: "https://picsum.photos/200",
        mediaUrl: "https://picus.photos/200",
        mediaType: "image/plain",
        creators: [
          {
            name: profile.nickname,
            address: profile.address,
            contributionPercent: 100,
          },
        ],
      };

      const nftMetadata: NftMetadata = {
        name: postTitle,
        description: postText,
        image: "https://picsum.photos/600/800?random=42",
      };

      await registerIpAsset({
        ipMetadata,
        nftMetadata,
        licenses: selected,
        commercialUseConfig: selected.includes("COMMERCIAL_USE")
          ? { priceIp: Number(commercialUsePrice) }
          : undefined,
        commercialRemixConfig: selected.includes("COMMERCIAL_REMIX")
          ? {
              priceIp: Number(commercialRemixPrice),
              revenueSharePct: Number(commercialRemixShare),
            }
          : undefined,
      });

      /////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////
      // Story Protocol 클라이언트 생성
      const client = await createStoryClient();

      // 라이선스 텀 데이터 생성
      const licenseTermsData = [];

      if (selected.includes("OPEN_USE")) {
        licenseTermsData.push({
          terms: PILFlavor.creativeCommonsAttribution({
            currency: WIP_TOKEN_ADDRESS,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
          }),
        });
      }

      if (selected.includes("COMMERCIAL_USE")) {
        const price = Number(commercialUsePrice);
        licenseTermsData.push({
          terms: PILFlavor.commercialUse({
            defaultMintingFee: BigInt(price),
            currency: WIP_TOKEN_ADDRESS,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
          }),
        });
      }

      if (selected.includes("COMMERCIAL_REMIX")) {
        const price = Number(commercialRemixPrice);
        const share = Number(commercialRemixShare);
        licenseTermsData.push({
          terms: PILFlavor.commercialRemix({
            defaultMintingFee: BigInt(price),
            commercialRevShare: share,
            currency: WIP_TOKEN_ADDRESS,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
          }),
          maxLicenseTokens: 100,
        });
      }

      // NON_COMMERCIAL_REMIX는 Story Protocol SDK에서 직접 지원하지 않으므로
      // creativeCommonsAttribution을 사용하거나 제외
      if (selected.includes("NON_COMMERCIAL_REMIX")) {
        licenseTermsData.push({
          terms: PILFlavor.creativeCommonsAttribution({
            currency: WIP_TOKEN_ADDRESS,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
          }),
        });
      }

      // SPG NFT 컨트랙트 주소 (예제 값, 실제로는 동적으로 생성하거나 설정 필요)
      const spgNftContract = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";

      // IP 메타데이터 (실제로는 IPFS에 업로드한 후 URL 사용)
      const metadata = {
        ipMetadataURI:
          "https://ipfs.io/ipfs/bafkreiardkgvkejqnnkdqp4pamkx2e5bs4lzus5trrw3hgmoa7dlbb6foe",
        ipMetadataHash: toHex("test-metadata-hash", { size: 32 }),
        nftMetadataURI:
          "https://ipfs.io/ipfs/bafkreicexrvs2fqvwblmgl3gnwiwh76pfycvfs66ck7w4s5omluyhti2kq",
        nftMetadataHash: toHex("test-nft-metadata-hash", { size: 32 }),
      };

      if (isRoot) {
        // registerIpAsset 호출
        const response = await client.ipAsset.registerIpAsset({
          nft: { type: "mint", spgNftContract: spgNftContract },
          licenseTermsData: licenseTermsData,
          royaltyShares: [
            {
              recipient: "0xb05ff66a7eac8a6e600d83fbdb8c3c1f208fa59e", // 실제 수신자 주소로 변경 필요
              percentage: 10,
            },
          ],
          ipMetadata: metadata,
        });

        // IPID 저장 필요 (부모 ipId)
        console.log(
          `Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}, License Terms ID: ${response.licenseTermsIds}`
        );
      } else {
        // 파생 IP Asset 등록
        // TODO: 실제 부모 IP Asset의 IP ID를 가져와야 합니다
        // 부모 StoryBook에서 ipId를 저장하거나, 데이터베이스에서 조회해야 합니다
        const parentIpId = "0xDFfA4620230B36592C756138A3F82700AD3c2cCc"; // 부모 IP Asset의 IP ID (실제 값으로 교체 필요)

        // TODO: 부모 IP Asset의 라이선스 텀 ID를 조회해야 합니다
        // 부모 IP Asset에 등록된 라이선스 텀 중에서 사용할 라이선스 텀 ID를 선택
        // 예: COMMERCIAL_REMIX 라이선스를 사용하려면 해당 라이선스 텀 ID가 필요
        // licenseTermsIds는 bigint 배열이어야 합니다
        // 주의: parentIpIds의 개수와 licenseTermsIds의 개수가 일치해야 합니다
        // 각 부모 IP ID에 대해 하나의 라이선스 텀 ID가 필요합니다
        // 하나의 부모 IP Asset에서 파생할 때는 하나의 라이선스 텀 ID만 사용해야 합니다
        const commercialRemixLicenseTermsId = 2590n; // 부모 IP Asset의 COMMERCIAL_REMIX 라이선스 텀 ID (실제 값으로 교체 필요)

        const response = await client.ipAsset.registerDerivativeIpAsset({
          nft: { type: "mint", spgNftContract },
          derivData: {
            parentIpIds: [parentIpId], // 하나의 부모 IP ID
            licenseTermsIds: [commercialRemixLicenseTermsId], // 하나의 라이선스 텀 ID (부모 IP ID 개수와 일치)
          },
          ipMetadata: {
            ipMetadataURI:
              "https://ipfs.io/ipfs/bafkreiardkgvkejqnnkdqp4pamkx2e5bs4lzus5trrw3hgmoa7dlbb6foe",
            ipMetadataHash: toHex("test-metadata-hash", { size: 32 }),
            nftMetadataURI:
              "https://ipfs.io/ipfs/bafkreicexrvs2fqvwblmgl3gnwiwh76pfycvfs66ck7w4s5omluyhti2kq",
            nftMetadataHash: toHex("test-nft-metadata-hash", { size: 32 }),
          },
          royaltyShares: [
            {
              recipient: "0xb05ff66a7eac8a6e600d83fbdb8c3c1f208fa59e", // 실제 수신자 주소로 변경 필요
              percentage: 10,
            },
          ],
        });

        console.log(
          `Derivative IPA linked to parent at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
        );
      }
      /////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////

      // 성공 후 결과 전달
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
    } catch (error) {
      console.error("IP Asset 등록 중 오류 발생:", error);
      alert(
        `IP Asset 등록 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsPosting(false);
    }
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
            disabled={isPosting}
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
                    value={commercialUseShare}
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
              <div className="text-[11px] text-gray-400 mb-1">Title</div>
              <p className="text-sm text-gray-100 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {postTitle}
              </p>
            </div>
            <div className="space-y-1 border border-gray-800 rounded-xl p-3">
              <div className="text-[11px] text-gray-400 mb-1">Content</div>
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
                className="
                  px-3 py-1.5 rounded-full text-xs text-gray-300 
                  border border-gray-700 hover:bg-gray-800 
                  transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
                onClick={() => {
                  if (hasCommercialSelected) {
                    setStep(2);
                  } else {
                    setStep(1);
                  }
                }}
                disabled={isPosting}
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
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                  onClick={handlePost}
                  disabled={isPosting}
                >
                  <span>
                    {isPosting ? "Registering..." : "Get some $IP to Register"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
