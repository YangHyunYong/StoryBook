import axios from "axios";
import {
  dataUrlToFile,
  ipfsGatewayUrl,
  uploadFileToIPFS,
} from "../../utils/ipfs";

// API 기본 URL 설정 (환경 변수 또는 기본값)
// 서버가 별도 프로젝트에 배포된 경우 서버 URL을 명시적으로 설정
const API_BASE_URL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== "")
    ? import.meta.env.VITE_API_URL.trim()
    : "";
export type GenerateAndPinImageResult = {
  imageUrl: string;
  cid: string;
  ipfsUrl: string;
};

export async function generateAndPinImage(
  title: string,
  prompt: string
): Promise<GenerateAndPinImageResult> {
    // URL 슬래시 정규화 (이중 슬래시 방지)
    const baseUrl = API_BASE_URL.endsWith("/") 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
    // 서버의 실제 API 경로 사용 (rewrites를 통해 /stability로 매핑됨)
    const endpoint = "/api/stability/generate";
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
    
    const response = await axios.post(
      url,
      { prompt },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const imageUrl: string | undefined =
      response.data?.imageDataUrl ?? response.data?.imageUrl;

    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      throw new Error("이미지 생성 응답이 올바르지 않습니다.");
    }

  const fileName = `story-cover-${title}-${Date.now()}.jpg`;
  const file = dataUrlToFile(imageUrl, fileName);

  const cid = await uploadFileToIPFS(file);

  return {
    imageUrl,
    cid,
    ipfsUrl: ipfsGatewayUrl(cid),
  };
}
