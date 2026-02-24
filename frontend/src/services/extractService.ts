import mammoth from 'mammoth';

async function extractPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Configure the worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const data = new Uint8Array(arrayBuffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.map((text, i) => `--- Page ${i + 1} ---\n\n${text}`).join('\n\n');
}

export async function extractFromFile(
  file: File
): Promise<{ extracted_text: string; maybe_scanned?: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const arrayBuffer = await file.arrayBuffer();

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { extracted_text: result.value };
  }

  if (ext === 'pdf') {
    const extractedText = await extractPdf(arrayBuffer);
    const cleanLength = extractedText.replace(/[\s\d\-]|--- Page \d+ ---/g, '').length;
    const maybeScanned = cleanLength < 200;
    return { extracted_text: extractedText, maybe_scanned: maybeScanned };
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

export async function extractFromText(
  text: string
): Promise<{ extracted_text: string }> {
  return { extracted_text: text };
}
