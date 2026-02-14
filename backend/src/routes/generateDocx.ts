import { Request, Response } from 'express';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { buildDefaultTemplateBuffer } from '../defaultTemplate';

export async function generateDocxHandler(req: Request, res: Response) {
  let improvedJson: any;
  try {
    improvedJson = JSON.parse(req.body.improved_json);
  } catch {
    res.status(400).json({ error: 'Invalid improved_json field' });
    return;
  }

  const templatePath = req.file?.path;

  try {
    const content = templatePath
      ? fs.readFileSync(templatePath, 'binary')
      : buildDefaultTemplateBuffer();
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

    const rawName = (improvedJson.name || 'Resume').replace(/\s+/g, '_').slice(0, 100);
    const asciiName = rawName.replace(/[^\w.-]/g, '_');
    const encodedName = encodeURIComponent(rawName);
    res.setHeader('Content-Disposition', `attachment; filename="Resume_${asciiName}.docx"; filename*=UTF-8''Resume_${encodedName}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: `Template rendering failed: ${err.message}. Check placeholder spelling.` });
  } finally {
    if (templatePath) fs.unlink(templatePath, () => {});
  }
}
