import { Request, Response } from 'express';

export async function healthHandler(_req: Request, res: Response) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (apiKey) {
    res.json({ ok: true, model: 'gemini-2.5-flash-lite' });
  } else {
    res.json({ ok: false, model: null });
  }
}
