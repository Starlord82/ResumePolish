import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { loadTemplate } from './templateService';

function stripBoldMarkers(obj: any): any {
  if (typeof obj === 'string') return obj.replace(/\*\*/g, '');
  if (Array.isArray(obj)) return obj.map(stripBoldMarkers);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) out[k] = stripBoldMarkers(v);
    return out;
  }
  return obj;
}

export async function generateDocxBlob(
  improvedJson: any,
  opts: { templateFile?: File | null; lang?: 'he' | 'en'; style?: string }
): Promise<Blob> {
  const data = stripBoldMarkers(improvedJson);
  const rtl = (opts.lang || 'en') === 'he';

  const { content } = await loadTemplate(opts.style, rtl, opts.templateFile);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return blob as Blob;
}
