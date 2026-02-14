import { Request, Response } from 'express';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function extractPdf(filePath: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  const data = new Uint8Array(fs.readFileSync(filePath));
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

export async function extractHandler(req: Request, res: Response) {
  // Text-only mode
  if (!req.file) {
    const text = req.body?.text;
    if (text) {
      res.json({ extracted_text: text });
      return;
    }
    res.status(400).json({ error: 'No file uploaded and no text provided' });
    return;
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let extractedText = '';

    if (ext === '.docx') {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (ext === '.pdf') {
      extractedText = await extractPdf(filePath);
    } else {
      res.status(400).json({ error: `Unsupported file type: ${ext}` });
      return;
    }

    // Check for scanned/garbage PDF
    const cleanLength = extractedText.replace(/[\s\d\-]|--- Page \d+ ---/g, '').length;
    const maybeScanned = ext === '.pdf' && cleanLength < 200;

    res.json({ extracted_text: extractedText, maybe_scanned: maybeScanned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
}
