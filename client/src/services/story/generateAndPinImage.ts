import axios from "axios";
import {
  dataUrlToFile,
  ipfsGatewayUrl,
  uploadFileToIPFS,
} from "../../utils/ipfs";

// API 기본 URL 설정 (환경 변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SAMPLE_IMAGE_URL = import.meta.env.VITE_SAMPLE_IMAGE_URL;

export type GenerateAndPinImageResult = {
  imageUrl: string;
  cid: string;
  ipfsUrl: string;
};

export async function generateAndPinImage(
  title: string,
  prompt: string
): Promise<GenerateAndPinImageResult> {
  //   const response = await axios.post(
  //     `${API_BASE_URL}/stability/generate`,
  //     { prompt },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   const imageUrl: string | undefined =
  //     response.data?.imageDataUrl ?? response.data?.imageUrl;

  //   if (!imageUrl || !imageUrl.startsWith("data:image")) {
  //     throw new Error("이미지 생성 응답이 올바르지 않습니다.");
  //   }

  // test
  const imageUrl = SAMPLE_IMAGE_URL;

  const fileName = `story-cover-${title}-${Date.now()}.jpg`;
  const file = dataUrlToFile(imageUrl, fileName);

  const cid = await uploadFileToIPFS(file);

  return {
    imageUrl,
    cid,
    ipfsUrl: ipfsGatewayUrl(cid),
  };
}
