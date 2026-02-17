const BASE = '/api';

export interface StyleInfo {
  id: string;
  name: string;
}

export async function checkHealth(): Promise<{ ok: boolean; model: string | null }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

export async function fetchStyles(): Promise<StyleInfo[]> {
  const res = await fetch(`${BASE}/styles`);
  return res.json();
}

export async function extractResume(file: File): Promise<{ extracted_text: string; maybe_scanned?: boolean }> {
  const form = new FormData();
  form.append('resume_file', file);
  const res = await fetch(`${BASE}/extract`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function improveResume(payload: {
  extracted_text: string;
  target_job: string;
  keywords?: string;
  output_language: 'he' | 'en';
  intensity: string;
}): Promise<{ improved?: any; error?: string; raw_output?: string }> {
  const res = await fetch(`${BASE}/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}). The AI request may have timed out — try again.`);
  }
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || `Server error: ${res.status}`, raw_output: data.raw_output };
  }
  return data;
}

export async function downloadDocx(
  improvedJson: any,
  opts: { templateFile?: File | null; lang?: 'he' | 'en'; style?: string }
): Promise<Blob> {
  const form = new FormData();
  if (opts.templateFile) form.append('template_file', opts.templateFile);
  form.append('improved_json', JSON.stringify(improvedJson));
  if (opts.lang) form.append('lang', opts.lang);
  if (opts.style) form.append('style', opts.style);
  const res = await fetch(`${BASE}/generate-docx`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.blob();
}

export async function downloadPdf(
  improvedJson: any,
  opts: { templateFile?: File | null; lang?: 'he' | 'en'; style?: string }
): Promise<Blob> {
  const form = new FormData();
  if (opts.templateFile) form.append('template_file', opts.templateFile);
  form.append('improved_json', JSON.stringify(improvedJson));
  if (opts.lang) form.append('lang', opts.lang);
  if (opts.style) form.append('style', opts.style);
  const res = await fetch(`${BASE}/generate-pdf`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.blob();
}
