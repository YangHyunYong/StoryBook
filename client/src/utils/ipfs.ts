import { PinataSDK } from "pinata-web3";

type JsonUploadOptions = {
  kind: "ip" | "nft";
  baseName: string | undefined;
};

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error("PINATA_JWT is not set in .env");
}

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
});

export async function uploadFileToIPFS(file: File): Promise<string> {
  const { IpfsHash } = await pinata.upload.file(file);
  return IpfsHash;
}

export async function uploadJSONToIPFS<T extends object>(
  jsonMetadata: T,
  options?: JsonUploadOptions
): Promise<string> {
  let upload = pinata.upload.json(jsonMetadata);
  if (options && options.baseName) {
    const fileName = buildPinataJsonName(options.kind, options.baseName);
    upload = upload.addMetadata({
      name: fileName,
    });
  }

  const { IpfsHash } = await upload;
  return IpfsHash;
}

export function ipfsGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  // 구조에서 앞부분과 데이터 분리
  const [meta, base64Data] = dataUrl.split(",");
  if (!base64Data) {
    throw new Error("Invalid data URL");
  }

  // content-type 추출
  const match = meta.match(/data:(.*);base64/);
  const mime = match?.[1] || "application/octet-stream";

  // base64 → binary
  const binary = atob(base64Data);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
}

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildPinataJsonName(kind: "ip" | "nft", baseName: string): string {
  const safeBase = baseName.trim() || "untitled";
  const prefix = kind === "ip" ? "IP" : "NFT";
  return `${prefix}-${safeBase}-${Date.now()}.json`;
}
