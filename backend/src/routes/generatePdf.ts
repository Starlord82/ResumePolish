import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { loadStyleTemplate } from '../loadStyleTemplate';

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

export async function generatePdfHandler(req: Request, res: Response) {
  let improvedJson: any;
  try {
    improvedJson = stripBoldMarkers(JSON.parse(req.body.improved_json));
  } catch {
    res.status(400).json({ error: 'Invalid improved_json field' });
    return;
  }

  const templatePath = req.file?.path;
  const lang = req.body.lang || 'en';
  const rtl = lang === 'he';
  const style = req.body.style;
  const tmpDir = '/tmp/pdf-gen-' + Date.now();

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    // Generate DOCX
    const content = templatePath
      ? fs.readFileSync(templatePath, 'binary')
      : loadStyleTemplate(style, rtl);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(improvedJson);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const docxPath = path.join(tmpDir, 'output.docx');
    fs.writeFileSync(docxPath, buf);

    // Convert to PDF via LibreOffice
    execSync(
      `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`,
      { timeout: 60000 }
    );

    const pdfPath = path.join(tmpDir, 'output.pdf');
    if (!fs.existsSync(pdfPath)) {
      res.status(500).json({ error: 'PDF conversion failed — LibreOffice did not produce output' });
      return;
    }

    const pdfBuf = fs.readFileSync(pdfPath);
    const rawName = (improvedJson.name || 'Resume').replace(/\s+/g, '_').slice(0, 100);
    const asciiName = rawName.replace(/[^\w.-]/g, '_');
    const encodedName = encodeURIComponent(rawName);
    res.setHeader('Content-Disposition', `attachment; filename="Resume_${asciiName}.pdf"; filename*=UTF-8''Resume_${encodedName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ error: `PDF generation failed: ${err.message}` });
  } finally {
    if (templatePath) fs.unlink(templatePath, () => {});
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
}
