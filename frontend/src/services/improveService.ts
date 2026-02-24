import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetch } from '@tauri-apps/plugin-http';
import { SYSTEM_PROMPT, buildUserPrompt, TEMPERATURE_MAP } from './prompt';
import { getApiKey } from './apiKeyStore';

function extractJson(raw: string): any | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string') return parsed;
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed.name === 'string') return parsed;
    } catch {}
  }

  return null;
}

export async function improveWithGemini(payload: {
  extracted_text: string;
  target_job: string;
  keywords?: string;
  output_language: 'he' | 'en';
  intensity: string;
}): Promise<{ improved?: any; error?: string; raw_output?: string }> {
  const { extracted_text, target_job, keywords, output_language, intensity } = payload;

  if (!extracted_text) {
    return { error: 'extracted_text is required' };
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return { error: 'Gemini API key is not configured. Please set it in Settings.' };
  }

  const lang = output_language === 'en' ? 'en' : 'he';
  const intens = (['conservative', 'balanced', 'aggressive'] as string[]).includes(intensity)
    ? intensity
    : 'balanced';
  const temperature = TEMPERATURE_MAP[intens] ?? 0.5;

  const userPrompt = buildUserPrompt(
    extracted_text,
    target_job || '',
    lang as 'he' | 'en',
    intens as 'conservative' | 'balanced' | 'aggressive',
    keywords || ''
  );

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Override the global fetch with Tauri's fetch to bypass CORS
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetch as any;

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(userPrompt);
      const content = result.response.text();

      const parsed = extractJson(content);
      if (parsed) {
        return { improved: parsed };
      } else {
        return {
          error: 'Failed to parse AI output as JSON',
          raw_output: content,
        };
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  } catch (err: any) {
    return { error: err.message || 'Gemini API error' };
  }
}
