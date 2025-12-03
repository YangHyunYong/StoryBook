import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseEther } from "viem";
import {
  registerDerivativeIpAsset,
  registerIpAsset,
} from "../services/story/registerIpAsset";
import { generateAndPinImage } from "../services/story/generateAndPinImage";
import { supabase } from "../utils/supabaseClient";

import type { IpMetadata } from "@story-protocol/core-sdk";
import type { NftMetadata } from "../types/ipAsset";
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
  parentId?: number | null;
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
  parentId,
}: LicenseSelectionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<LicenseType[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [availableLicenseOptions, setAvailableLicenseOptions] = useState<
    typeof LICENSE_OPTIONS
  >([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);
  const navigate = useNavigate();

  const [commercialUsePrice, setCommercialUsePrice] = useState("");
  const [commercialUseShare, setCommercialUseShare] = useState("");
  const [commercialRemixPrice, setCommercialRemixPrice] = useState("");
  const [commercialRemixShare, setCommercialRemixShare] = useState("");

  // isRoot가 false이고 parentId가 있으면 부모 스토리의 license 정보를 가져와서 필터링
  useEffect(() => {
    const fetchParentLicense = async () => {
      setIsLoadingLicenses(true);

      if (isRoot || !parentId || !supabase) {
        setAvailableLicenseOptions(LICENSE_OPTIONS);
        setIsLoadingLicenses(false);
        return;
      }

      try {
        const { data: licenseData, error } = await supabase
          .from("license")
          .select("license_info")
          .eq("id", parentId)
          .single();

        if (error || !licenseData) {
          console.error("Failed to fetch parent license:", error);
          setAvailableLicenseOptions(LICENSE_OPTIONS);
          setIsLoadingLicenses(false);
          return;
        }

        // license_info는 (number, string)[] 형태
        // string 부분을 추출하여 사용 가능한 라이선스 타입 결정
        const licenseInfo = licenseData.license_info as [number, string][];
        console.log("licenseInfo", licenseInfo);
        const availableTypes = licenseInfo.map(
          ([, typeString]) => typeString as LicenseType
        );

        // LICENSE_OPTIONS에서 사용 가능한 타입만 필터링
        const filteredOptions = LICENSE_OPTIONS.filter((option) =>
          availableTypes.includes(option.type)
        );

        setAvailableLicenseOptions(filteredOptions);
      } catch (err) {
        console.error("Error fetching parent license:", err);
        setAvailableLicenseOptions(LICENSE_OPTIONS);
      } finally {
        setIsLoadingLicenses(false);
      }
    };

    if (isOpen) {
      fetchParentLicense();
    }
  }, [isOpen, isRoot, parentId]);

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
    if (!isRoot) {
      // derivative 스토리인 경우 하나만 선택 가능
      setSelected((prev) => (prev.includes(type) ? [] : [type]));
    } else {
      // root 스토리인 경우 여러 개 선택 가능
      setSelected((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      );
    }
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
      const { imageUrl, ipfsUrl } = await generateAndPinImage(
        postTitle,
        postText
      );
      console.log("imageUrl: ", imageUrl);
      console.log("ipfsUrl: ", ipfsUrl);

      const ipMetadata: IpMetadata = {
        title: postTitle,
        description: postText,
        image: ipfsUrl,
        mediaUrl: ipfsUrl,
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
        image: ipfsUrl,
      };

      let result: LicenseSelectionResult & {
        ipId: string;
        licenseTermsIds: bigint[];
        createdLicenseTypes: LicenseType[];
      };

      // derivative 스토리인 경우 부모의 license_info와 ip_id를 먼저 가져옴
      let parentLicenseTermsId: bigint | undefined;
      let parentIpId: string | undefined;
      if (!isRoot && parentId && supabase && selected.length > 0) {
        try {
          // 부모 스토리의 ip_id 가져오기
          const { data: parentStoryData, error: storyError } = await supabase
            .from("story")
            .select("ip_id")
            .eq("id", parentId)
            .single();

          if (storyError || !parentStoryData || !parentStoryData.ip_id) {
            throw new Error(
              `Failed to fetch parent story ip_id: ${
                storyError?.message || "No ip_id found"
              }`
            );
          }

          parentIpId = parentStoryData.ip_id;

          // 부모의 license_info에서 licenseTermsId 가져오기
          const { data: parentLicenseData, error: licenseError } =
            await supabase
              .from("license")
              .select("license_info")
              .eq("id", parentId)
              .single();

          if (
            licenseError ||
            !parentLicenseData ||
            !parentLicenseData.license_info
          ) {
            throw new Error(
              `Failed to fetch parent license: ${
                licenseError?.message || "No license_info found"
              }`
            );
          }

          const parentLicenseInfo = parentLicenseData.license_info as [
            number,
            string
          ][];
          // 선택한 라이선스 타입에 해당하는 licenseTermsId 찾기
          const selectedLicenseType = selected[0]; // derivative는 하나만 선택 가능
          const matchingLicense = parentLicenseInfo.find(
            ([, typeString]) => typeString === selectedLicenseType
          );

          if (matchingLicense) {
            parentLicenseTermsId = BigInt(matchingLicense[0]);
          } else {
            throw new Error(
              `Selected license type ${selectedLicenseType} not found in parent license_info`
            );
          }
        } catch (err) {
          console.error(
            "Error fetching parent data for derivative registration:",
            err
          );
          throw err;
        }
      }

      if (isRoot) {
        result = await registerIpAsset({
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
      } else {
        if (!parentLicenseTermsId) {
          throw new Error(
            "licenseTermsId is required for derivative IP asset registration"
          );
        }
        if (!parentIpId) {
          throw new Error(
            "parentIpId is required for derivative IP asset registration"
          );
        }

        result = await registerDerivativeIpAsset({
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
          licenseTermsId: parentLicenseTermsId,
          parentIpId: parentIpId,
        });
      }

      // license_info 생성: (number, string)[] 형태
      let licenseInfo: [number, string][] = [];

      if (isRoot) {
        // root 스토리인 경우: licenseTermsIds와 createdLicenseTypes 배열을 순서대로 매핑
        licenseInfo = result.licenseTermsIds.map((id: bigint, idx: number) => [
          Number(id),
          result.createdLicenseTypes[idx] || "",
        ]);
      } else {
        // derivative 스토리인 경우: 이미 찾은 parentLicenseTermsId와 선택한 라이선스 타입 사용
        if (parentLicenseTermsId && selected.length > 0) {
          const selectedLicenseType = selected[0]; // derivative는 하나만 선택 가능
          licenseInfo = [[Number(parentLicenseTermsId), selectedLicenseType]];
        }
      }

      let createdStoryId: number | undefined;
      // license 테이블에 저장
      if (supabase) {
        try {
          // 가격을 wei 단위로 변환 (bigint 타입에 맞추기 위해)
          const commercialUsePriceWei =
            selected.includes("COMMERCIAL_USE") && commercialUsePrice
              ? BigInt(parseEther(String(commercialUsePrice)))
              : null;

          const commercialRemixPriceWei =
            selected.includes("COMMERCIAL_REMIX") && commercialRemixPrice
              ? BigInt(parseEther(String(commercialRemixPrice)))
              : null;

          const { data: licenseData, error: licenseError } = await supabase
            .from("license")
            .insert({
              license_info: licenseInfo,
              commercial_use_price: commercialUsePriceWei
                ? commercialUsePriceWei.toString()
                : null,
              commercial_remix_price: commercialRemixPriceWei
                ? commercialRemixPriceWei.toString()
                : null,
              commercial_remix_share:
                selected.includes("COMMERCIAL_REMIX") && commercialRemixShare
                  ? BigInt(Number(commercialRemixShare)).toString()
                  : null,
            })
            .select()
            .single();

          if (licenseError) {
            console.error("Failed to save license to Supabase:", licenseError);
          } else {
            console.log("License saved to Supabase:", licenseData);

            // story 테이블에 저장
            // registerIpAsset 실행 시에는 parent_id를 제외
            const storyData: {
              title: string;
              author: string;
              content: string;
              image_url: string | null;
              timestamp: number;
              ip_id: string;
              address: string;
              parent_id?: number | null;
            } = {
              title: postTitle,
              author: profile.nickname,
              content: postText,
              image_url: ipfsUrl || null,
              timestamp: Date.now(),
              ip_id: result.ipId,
              address: profile.address,
            };

            // registerIpAsset이 아닌 경우에만 parent_id 추가
            if (!isRoot && parentId) {
              storyData.parent_id = parentId;
            }

            const { data: storyDataResult, error: storyError } = await supabase
              .from("story")
              .insert(storyData)
              .select()
              .single();

            if (storyError) {
              console.error("Failed to save story to Supabase:", storyError);
            } else {
              console.log(
                "Story saved to Supabase successfully:",
                storyDataResult
              );
              // 생성된 story의 id를 사용할 수 있습니다
              createdStoryId = storyDataResult?.id;
              if (createdStoryId) {
                console.log("Created story ID:", createdStoryId);
              }
            }
          }
        } catch (error) {
          console.error("Error saving to Supabase:", error);
        }
      } else {
        console.warn(
          "Supabase client is not configured. Data not saved to database."
        );
      }

      onConfirm(result);
      resetState();
      navigate(`/story/${createdStoryId}`);
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
              {isRoot
                ? "You can add up to 5 licenses to this asset"
                : "Select one license from the parent story"}
            </p>
            {isLoadingLicenses ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-gray-400">
                  Loading available licenses...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableLicenseOptions.map((option) => {
                  console.log("availableLicenseOptions", option);
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
                      <div className="font-semibold text-sm">
                        {option.title}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
