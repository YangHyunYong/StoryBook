export type LicenseType =
  | "OPEN_USE"
  | "NON_COMMERCIAL_REMIX"
  | "COMMERCIAL_USE"
  | "COMMERCIAL_REMIX";

export type LicenseInfo = {
  licenseType: LicenseType;
  licenseTermsId: string;
};

export interface CommercialLicenseConfig {
  priceIp: number;
  revenueSharePct: number;
}

export interface LicenseSelectionResult {
  licenseInfo: LicenseInfo[];
  commercialUse?: CommercialLicenseConfig;
  commercialRemix?: CommercialLicenseConfig;
}
