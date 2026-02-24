import { extractFromFile, extractFromText } from './services/extractService';
import { improveWithGemini } from './services/improveService';
import { generateDocxBlob } from './services/docxService';
import { generatePdfBlob } from './services/pdfService';
import { getAvailableStyles, type StyleInfo } from './services/templateService';
import { hasApiKey } from './services/apiKeyStore';

export type { StyleInfo };

export async function checkHealth(): Promise<{ ok: boolean; model: string | null }> {
  const ok = await hasApiKey();
  return { ok, model: ok ? 'gemini-2.5-flash-lite' : null };
}

export async function fetchStyles(): Promise<StyleInfo[]> {
  return getAvailableStyles();
}

export async function extractResume(
  file: File
): Promise<{ extracted_text: string; maybe_scanned?: boolean }> {
  return extractFromFile(file);
}

export async function extractResumeText(
  text: string
): Promise<{ extracted_text: string }> {
  return extractFromText(text);
}

export async function improveResume(payload: {
  extracted_text: string;
  target_job: string;
  keywords?: string;
  output_language: 'he' | 'en';
  intensity: string;
}): Promise<{ improved?: any; error?: string; raw_output?: string }> {
  return improveWithGemini(payload);
}

export async function downloadDocx(
  improvedJson: any,
  opts: { templateFile?: File | null; lang?: 'he' | 'en'; style?: string }
): Promise<Blob> {
  return generateDocxBlob(improvedJson, opts);
}

export async function downloadPdf(
  improvedJson: any,
  opts: { templateFile?: File | null; lang?: 'he' | 'en'; style?: string }
): Promise<Blob> {
  return generatePdfBlob(improvedJson, { lang: opts.lang });
}
