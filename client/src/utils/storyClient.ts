import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";
import { http, custom, type Address } from "viem";
import { privateKeyToAccount, type Account } from "viem/accounts";

// 브라우저 환경에서 MetaMask를 통해 클라이언트 생성
export async function createStoryClient(): Promise<StoryClient> {
  if (!window.ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }

  // MetaMask에서 계정 가져오기
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("계정을 찾을 수 없습니다.");
  }

  const address = accounts[0] as Address;

  // Story Protocol SDK는 account와 transport를 모두 필요로 함
  // transport는 custom(window.ethereum)을 사용하여 MetaMask를 통해 서명 처리
  // account는 address만 있어도 되지만, SDK가 요구하는 형식에 맞춰야 함
  // SDK가 내부적으로 transport를 통해 서명을 처리하므로, account는 address만 전달
  // 하지만 타입 정의상 Account 객체가 필요하므로, 최소한의 Account 객체 생성
  const account: Account = {
    address,
    type: "json-rpc", // MetaMask는 JSON-RPC를 통해 서명 처리
  } as Account;

  const config: StoryConfig = {
    account: account,
    transport: custom(window.ethereum),
    chainId: "aeneid",
  };

  return StoryClient.newClient(config);
}

// 서버 사이드용 (환경 변수 사용)
// 주의: 브라우저 환경에서는 private key를 직접 사용하지 않는 것이 좋습니다
export function createStoryClientFromPrivateKey(): StoryClient {
  const privateKeyEnv = import.meta.env.VITE_WALLET_PRIVATE_KEY;
  if (!privateKeyEnv) {
    throw new Error("VITE_WALLET_PRIVATE_KEY 환경 변수가 설정되지 않았습니다.");
  }
  const privateKey: Address = `0x${privateKeyEnv}`;
  const account: Account = privateKeyToAccount(privateKey);

  const config: StoryConfig = {
    account: account,
    transport: http(import.meta.env.VITE_RPC_PROVIDER_URL || "https://aeneid.storyrpc.io"),
    chainId: "aeneid",
  };

  return StoryClient.newClient(config);
}

