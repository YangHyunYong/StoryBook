import { PinataSDK } from "pinata-web3";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error("PINATA_JWT is not set in .env");
}

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
});

export async function uploadJSONToIPFS<T extends object>(
  jsonMetadata: T
): Promise<string> {
  const { IpfsHash } = await pinata.upload.json(jsonMetadata);
  return IpfsHash;
}

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
