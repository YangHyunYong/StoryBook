import { PILFlavor, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { parseEther } from "viem";
import { createStoryClient } from "../../utils/storyClient";
import { sha256Hex, uploadJSONToIPFS } from "../../utils/ipfs";
import type {
  LicenseTermsDataItem,
  RegisterIpAssetParams,
} from "../../types/ipAsset";
import type {
  LicenseType,
  LicenseInfo,
  LicenseSelectionResult,
} from "../../types/license";

// Aeneid testnet용 공개 SPG 컬렉션 주소
const spgNftContract = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";

export async function registerIpAsset({
  ipMetadata,
  nftMetadata,
  licenses,
  commercialUseConfig,
  commercialRemixConfig,
}: RegisterIpAssetParams) {
  const client = await createStoryClient();

  const ipIpfsHash = await uploadJSONToIPFS(ipMetadata, {
    kind: "ip",
    baseName: ipMetadata.title,
  });
  const ipHash = await sha256Hex(JSON.stringify(ipMetadata));

  const nftIpfsHash = await uploadJSONToIPFS(nftMetadata, {
    kind: "nft",
    baseName: nftMetadata.name,
  });
  const nftHash = await sha256Hex(JSON.stringify(nftMetadata));
  const licenseTermsData: LicenseTermsDataItem[] = [];
  const createdLicenseTypes: LicenseType[] = [];

  
  if (licenses.includes("OPEN_USE")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("OPEN_USE");
  }

  if (licenses.includes("NON_COMMERCIAL_REMIX")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("NON_COMMERCIAL_REMIX");
  }

  if (licenses.includes("COMMERCIAL_USE") && commercialUseConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialUse({
        defaultMintingFee: parseEther(String(commercialUseConfig.priceIp)),
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("COMMERCIAL_USE");
  }

  if (licenses.includes("COMMERCIAL_REMIX") && commercialRemixConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialRemix({
        defaultMintingFee: parseEther(String(commercialRemixConfig.priceIp)),
        commercialRevShare: commercialRemixConfig.revenueSharePct,
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3, // 발행 개수 제한
    });
    createdLicenseTypes.push("COMMERCIAL_REMIX");
  }

  const response = await client.ipAsset.registerIpAsset({
    nft: {
      type: "mint",
      spgNftContract,
    },
    licenseTermsData,
    ipMetadata: {
      ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
      nftMetadataHash: `0x${nftHash}`,
    },
  });

  console.log("parent ip asset license terms: ", response.licenseTermsIds);

  console.log(
    `Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
  );
  console.log(
    `View on the explorer: https://aeneid.explorer.story.foundation/ipa/${response.ipId}`
  );

  const licenseInfos: LicenseInfo[] = (response.licenseTermsIds ?? []).map(
    (id: bigint, idx: number) => ({
      licenseType: createdLicenseTypes[idx],
      licenseTermsId: id.toString(),
    })
  );

  const result: LicenseSelectionResult = {
    licenseInfo: licenseInfos,
  };

  // ipId와 licenseTermsIds를 반환하기 위해 result에 추가
  return {
    ...result,
    ipId: response.ipId,
    licenseTermsIds: response.licenseTermsIds ?? [],
    createdLicenseTypes,
  } as LicenseSelectionResult & {
    ipId: string;
    licenseTermsIds: bigint[];
    createdLicenseTypes: LicenseType[];
  };
}

export async function registerDerivativeIpAsset({
  ipMetadata,
  nftMetadata,
  licenses,
  commercialUseConfig,
  commercialRemixConfig,
  licenseTermsId,
  parentIpId,
}: RegisterIpAssetParams) {
  const client = await createStoryClient();
  const licenseTermsData: LicenseTermsDataItem[] = [];
  const createdLicenseTypes: LicenseType[] = [];

  const ipIpfsHash = await uploadJSONToIPFS(ipMetadata, {
    kind: "ip",
    baseName: ipMetadata.title,
  });
  const ipHash = await sha256Hex(JSON.stringify(ipMetadata));

  const nftIpfsHash = await uploadJSONToIPFS(nftMetadata, {
    kind: "nft",
    baseName: nftMetadata.name,
  });
  const nftHash = await sha256Hex(JSON.stringify(nftMetadata));

  if (licenses.includes("OPEN_USE")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("OPEN_USE");
  }

  // NON_COMMERCIAL_REMIX는 Story Protocol SDK에서 직접 지원하지 않으므로
  // creativeCommonsAttribution을 사용하거나 제외
  if (licenses.includes("NON_COMMERCIAL_REMIX")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("NON_COMMERCIAL_REMIX");
  }

  if (licenses.includes("COMMERCIAL_USE") && commercialUseConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialUse({
        defaultMintingFee: parseEther(String(commercialUseConfig.priceIp)),
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("COMMERCIAL_USE");
  }

  if (licenses.includes("COMMERCIAL_REMIX") && commercialRemixConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialRemix({
        defaultMintingFee: parseEther(String(commercialRemixConfig.priceIp)),
        commercialRevShare: commercialRemixConfig.revenueSharePct,
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 3,
    });
    createdLicenseTypes.push("COMMERCIAL_REMIX");
  }

  // licenseTermsId와 parentIpId가 제공되지 않으면 에러 발생
  if (!licenseTermsId) {
    throw new Error("licenseTermsId is required for derivative IP asset registration");
  }
  if (!parentIpId) {
    throw new Error("parentIpId is required for derivative IP asset registration");
  }

  const response = await client.ipAsset.registerDerivativeIpAsset({
    nft: { type: "mint", spgNftContract },
    derivData: {
      parentIpIds: [parentIpId as `0x${string}`], // 하나의 부모 IP ID
      licenseTermsIds: [licenseTermsId], // 전달받은 라이선스 텀 ID (부모 IP ID 개수와 일치)
    },
    ipMetadata: {
      ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
      nftMetadataHash: `0x${nftHash}`,
    },
  });

  console.log(
    `Derivative IPA linked to parent at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
  );

  // 부모 라이센스에서 가져와야 됨
  // const licenseInfos: LicenseInfo[] = (response.licenseTermsIds ?? []).map(
  //   (id: bigint, idx: number) => ({
  //     licenseType: createdLicenseTypes[idx],
  //     licenseTermsId: id.toString(),
  //   })
  // );

  // return {
  //   licenseInfos,
  // };

  const licenseInfos: LicenseInfo[] = [];
  const result: LicenseSelectionResult = {
    licenseInfo: licenseInfos,
  };
  
  // ipId 반환 (derivative의 경우 licenseTermsIds는 부모에서 가져와야 함)
  return {
    ...result,
    ipId: response.ipId,
    licenseTermsIds: [],
    createdLicenseTypes,
  } as LicenseSelectionResult & {
    ipId: string;
    licenseTermsIds: bigint[];
    createdLicenseTypes: LicenseType[];
  };
}
