import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildUserPrompt, TEMPERATURE_MAP } from '../prompt';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function extractJson(raw: string): any | null {
  // Direct parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string') return parsed;
  } catch {}

  // Extract first { ... } block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed.name === 'string') return parsed;
    } catch {}
  }

  return null;
}

export async function improveHandler(req: Request, res: Response) {
  const { extracted_text, target_job, output_language, intensity } = req.body;

  if (!extracted_text) {
    res.status(400).json({ error: 'extracted_text is required' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const lang = output_language === 'en' ? 'en' : 'he';
  const intens = ['conservative', 'balanced', 'aggressive'].includes(intensity)
    ? intensity
    : 'balanced';
  const temperature = TEMPERATURE_MAP[intens] ?? 0.5;

  const userPrompt = buildUserPrompt(extracted_text, target_job || '', lang, intens);

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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
      res.json({ improved: parsed });
    } else {
      res.status(400).json({
        error: 'Failed to parse AI output as JSON',
        raw_output: content,
      });
    }
  } catch (err: any) {
    if (res.headersSent) return;
    res.status(500).json({ error: err.message || 'Gemini API error' });
  }
}
