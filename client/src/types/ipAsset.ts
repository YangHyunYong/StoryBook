import type { IpMetadata, PILFlavor } from "@story-protocol/core-sdk";
import type { LicenseType } from "./license";

export type NftMetadata = {
  name: string;
  description: string;
  image: string;
  attributes?: { trait_type: string; value: string }[];
};

type PilTerms =
  | ReturnType<typeof PILFlavor.creativeCommonsAttribution>
  | ReturnType<typeof PILFlavor.commercialUse>
  | ReturnType<typeof PILFlavor.commercialRemix>;

export type LicenseTermsDataItem = {
  terms: PilTerms;
  maxLicenseTokens?: number;
};

export type CommercialUseConfig = {
  priceIp: number;
};

export type CommercialRemixConfig = {
  priceIp: number;
  revenueSharePct: number;
};

export type RegisterIpAssetParams = {
  ipMetadata: IpMetadata;
  nftMetadata: NftMetadata;
  licenses: LicenseType[];
  commercialUseConfig?: CommercialUseConfig;
  commercialRemixConfig?: CommercialRemixConfig;
};
