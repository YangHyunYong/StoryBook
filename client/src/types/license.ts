export type LicenseType =
  | "OPEN_USE"
  | "NON_COMMERCIAL_REMIX"
  | "COMMERCIAL_USE"
  | "COMMERCIAL_REMIX";

export interface CommercialLicenseConfig {
  priceIp: number;
  revenueSharePct: number;
}

export interface LicenseSelectionResult {
  licenses: LicenseType[];
  commercialUse?: CommercialLicenseConfig;
  commercialRemix?: CommercialLicenseConfig;
}
