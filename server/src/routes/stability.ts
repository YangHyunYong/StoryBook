import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";

const router = Router();

router.post("/generate", async (req: Request, res: Response) => {
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
      style_preset: "pixel-art"
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
});

export default router;
