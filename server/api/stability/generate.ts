import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import FormData from "form-data";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정 (모든 요청에 대해 먼저 설정)
  const origin = req.headers.origin || req.headers.referer?.split("/").slice(0, 3).join("/");
  
  // 허용된 오리진 목록 (Vercel 도메인 포함)
  const allowedOrigins = [
    "https://story-x-dsrv.vercel.app",
    "https://story-x-dsrv-sbw8.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  
  // 와일드카드 서브도메인 지원
  const isAllowedOrigin = origin && (
    allowedOrigins.includes(origin) ||
    origin.includes("story-x-dsrv") ||
    origin.includes("localhost")
  );
  
  const allowOrigin = isAllowedOrigin ? origin : "*";

  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // OPTIONS 요청 (preflight)은 즉시 응답
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "STABILITY_API_KEY not set" });
    }

    // Stability.ai SD3 text-to-image 엔드포인트
    const apiUrl =
      "https://api.stability.ai/v2beta/stable-image/generate/sd3";

    // payload 객체 생성
    const payload = {
      prompt,
      aspect_ratio: "4:5",
      output_format: "jpeg",
      model: "sd3-medium",
      style_preset: "pixel-art",
    };

    // axios.postForm과 axios.toFormData를 사용하여 FormData 생성 및 전송
    const response = await axios.postForm(
      apiUrl,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
      }
    );

    if (response.status === 200) {
      // 이미지 바이너리 → base64 data URL 로 프론트에 전달
      const base64 = Buffer.from(response.data).toString("base64");
      const imageUrl = `data:image/jpeg;base64,${base64}`;

      return res.json({ imageUrl });
    } else {
      const errorText = response.data.toString();
      console.error("Stability error:", errorText);
      return res
        .status(response.status)
        .json({ error: "stability_error", detail: errorText });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
}

