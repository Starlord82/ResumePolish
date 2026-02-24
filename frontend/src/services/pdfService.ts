import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import ResumePdfDocument from '../pdf/ResumePdfDocument';
import type { ResumeData } from '../types';

export async function generatePdfBlob(
  data: ResumeData,
  opts: { lang?: 'he' | 'en' }
): Promise<Blob> {
  const rtl = (opts.lang || 'en') === 'he';
  const doc = createElement(ResumePdfDocument, { data, rtl });
  const blob = await pdf(doc as any).toBlob();
  return blob;
}
