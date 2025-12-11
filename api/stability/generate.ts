import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import FormData from "form-data";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
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

