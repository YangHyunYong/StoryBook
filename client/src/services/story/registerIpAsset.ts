import { PILFlavor, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { parseEther } from "viem";
import { createStoryClient } from "../../utils/storyClient";
import { sha256Hex, uploadJSONToIPFS } from "../../utils/ipfs";
import type {
  LicenseTermsDataItem,
  RegisterIpAssetParams,
} from "../../types/ipAsset";

export async function registerIpAsset({
  ipMetadata,
  nftMetadata,
  licenses,
  commercialUseConfig,
  commercialRemixConfig,
}: RegisterIpAssetParams) {
  const client = await createStoryClient();

  const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
  const ipHash = await sha256Hex(JSON.stringify(ipMetadata));

  const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
  const nftHash = await sha256Hex(JSON.stringify(nftMetadata));
  const licenseTermsData: LicenseTermsDataItem[] = [];

  if (licenses.includes("OPEN_USE")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
      }),
    });
  }

  if (licenses.includes("NON_COMMERCIAL_REMIX")) {
    licenseTermsData.push({
      terms: PILFlavor.creativeCommonsAttribution({
        currency: WIP_TOKEN_ADDRESS,
      }),
    });
  }

  if (licenses.includes("COMMERCIAL_USE") && commercialUseConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialUse({
        defaultMintingFee: parseEther(String(commercialUseConfig.priceIp)),
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
    });
  }

  if (licenses.includes("COMMERCIAL_REMIX") && commercialRemixConfig) {
    licenseTermsData.push({
      terms: PILFlavor.commercialRemix({
        defaultMintingFee: parseEther(String(commercialRemixConfig.priceIp)),
        commercialRevShare: commercialRemixConfig.revenueSharePct,
        currency: WIP_TOKEN_ADDRESS,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
      }),
      maxLicenseTokens: 100, // 발행 개수 제한
    });
  }

  const response = await client.ipAsset.registerIpAsset({
    nft: {
      type: "mint",
      // Aeneid testnet용 공개 SPG 컬렉션 주소
      spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
    },
    licenseTermsData,
    ipMetadata: {
      ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
      nftMetadataHash: `0x${nftHash}`,
    },
  });

  console.log(
    `Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
  );
  console.log(
    `View on the explorer: https://aeneid.explorer.story.foundation/ipa/${response.ipId}`
  );

  return response;
}
