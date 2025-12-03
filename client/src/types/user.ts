import type { Address } from "viem";

export interface UserProfile {
  address: Address;
  nickname: string;
  avatarUrl?: string;
}
