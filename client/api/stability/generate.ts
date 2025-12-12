// client/api/stability/generate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) 메서드 체크
  if (req.method === 'OPTIONS') {
    // same-origin이라 사실 CORS 필요 없지만, 혹시 모를 경우 대비
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      console.error('Missing STABILITY_API_KEY');
      return res.status(500).json({ error: 'STABILITY_API_KEY is not set' });
    }

    const apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

    const payload = {
      prompt,
      aspect_ratio: '4:5',
      output_format: 'jpeg',
      model: 'sd3-medium',
      style_preset: 'pixel-art',
    };

    // Stability API 호출 (백엔드에서만 실행)
    const response = await axios.postForm(
      apiUrl,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: () => true,
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
      }
    );

    if (response.status === 200) {
      const base64 = Buffer.from(response.data).toString('base64');
      const imageDataUrl = `data:image/jpeg;base64,${base64}`;

      // 프론트에서 사용하는 키: imageDataUrl / imageUrl 둘 다 지원
      return res.status(200).json({
        imageDataUrl,
        imageUrl: imageDataUrl,
      });
    } else {
      const errorText = response.data.toString();
      console.error('Stability error:', response.status, errorText);
      return res
        .status(response.status)
        .json({ error: 'stability_error', detail: errorText });
    }
  } catch (err: any) {
    console.error('Internal error:', err?.message || err);
    return res.status(500).json({ error: 'internal_error' });
  }
}