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
    });
    createdLicenseTypes.push("OPEN_USE");
  }

  if (licenses.includes("NON_COMMERCIAL_REMIX")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
      }),
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
      // maxLicenseTokens: 100, // 발행 개수 제한
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

  return result;
}

export async function registerDerivativeIpAsset({
  ipMetadata,
  nftMetadata,
  licenses,
  commercialUseConfig,
  commercialRemixConfig,
}: RegisterIpAssetParams) {
  const client = await createStoryClient();
  const licenseTermsData: LicenseTermsDataItem[] = [];
  const createdLicenseTypes: LicenseType[] = [];

  const licenseTerms1 = await client.license.getLicenseTerms(1300n);
  const licenseTerms2 = await client.license.getLicenseTerms(1300n);
  const licenseTerms3 = await client.license.getLicenseTerms(1788n);
  const licenseTerms4 = await client.license.getLicenseTerms(2441n);

  console.log("licenseTerms1: ", licenseTerms1);
  console.log("licenseTerms2: ", licenseTerms2);
  console.log("licenseTerms3: ", licenseTerms3);
  console.log("licenseTerms4: ", licenseTerms4);

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
      // maxLicenseTokens: 100,
    });
    createdLicenseTypes.push("COMMERCIAL_REMIX");
  }

  const parentIpId = "0xe9bc126Ad103f02432156af150BC401E7209FB6f"; // 부모 IP Asset의 IP ID (실제 값으로 교체 필요)

  // TODO: 부모 IP Asset의 라이선스 텀 ID를 조회해야 합니다
  // 부모 IP Asset에 등록된 라이선스 텀 중에서 사용할 라이선스 텀 ID를 선택
  // 예: COMMERCIAL_REMIX 라이선스를 사용하려면 해당 라이선스 텀 ID가 필요
  // licenseTermsIds는 bigint 배열이어야 합니다
  // 주의: parentIpIds의 개수와 licenseTermsIds의 개수가 일치해야 합니다
  // 각 부모 IP ID에 대해 하나의 라이선스 텀 ID가 필요합니다
  // 하나의 부모 IP Asset에서 파생할 때는 하나의 라이선스 텀 ID만 사용해야 합니다
  const commercialRemixLicenseTermsId = 1300n; // 부모 IP Asset의 COMMERCIAL_REMIX 라이선스 텀 ID (실제 값으로 교체 필요)

  const response = await client.ipAsset.registerDerivativeIpAsset({
    nft: { type: "mint", spgNftContract },
    derivData: {
      parentIpIds: [parentIpId], // 하나의 부모 IP ID
      licenseTermsIds: [commercialRemixLicenseTermsId], // 하나의 라이선스 텀 ID (부모 IP ID 개수와 일치)
    },
    royaltyShares: [
      {
        recipient: "0x9d09938618226b68df5558ba804c7c7bcd175824", // 실제 수신자 주소로 변경 필요
        percentage: 10,
      },
    ],
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
  return result;
}
