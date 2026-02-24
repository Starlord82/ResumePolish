import PizZip from 'pizzip';

/**
 * Load a named style template from public/templates/.
 * Returns the binary string content for PizZip.
 */
async function loadStyleDocx(styleName: string): Promise<ArrayBuffer> {
  const response = await globalThis.fetch(`/templates/${styleName}.docx`);
  if (!response.ok) {
    throw new Error(`Template not found: ${styleName}`);
  }
  return response.arrayBuffer();
}

/**
 * Build a default template programmatically (same logic as backend defaultTemplate.ts).
 */
function buildDefaultTemplate(rtl: boolean): Uint8Array {
  const zip = new PizZip();

  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>'
  );

  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>'
  );

  zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '</Relationships>'
  );

  const headerBlock =
    p({text: '{name}', bold: true, size: 32, color: 'FFFFFF', shading: '1A365D', align: rtl ? 'right' : 'left', rtl}) +
    p({text: '{title}', bold: true, size: 24, color: 'FFFFFF', shading: '1A365D', align: rtl ? 'right' : 'left', rtl}) +
    p({text: '{phone} | {email} | {linkedin}', size: 18, color: 'FFFFFF', shading: '1A365D', align: rtl ? 'right' : 'left', rtl});

  const body =
    headerBlock +
    p({text: '', rtl}) +
    p({text: '{summary}', size: 20, rtl}) +
    p({text: '', rtl}) +
    heading('Education & Courses', rtl) +
    loop('education',
      p({text: '{dates} | {degree} — {institution}', bold: true, size: 20, rtl}) +
      loop('bullets', p({text: '{.}', size: 20, rtl}))
    ) +
    heading('Experience', rtl) +
    loop('experience',
      p({text: '{dates} | {role} — {company}', bold: true, size: 20, rtl}) +
      loop('bullets', p({text: '{.}', size: 20, rtl}))
    ) +
    heading('Projects', rtl) +
    loop('projects',
      p({text: '{name} ({dates})', bold: true, size: 20, rtl}) +
      loop('bullets', p({text: '{.}', size: 20, rtl}))
    ) +
    p({text: '{#military_service}', rtl}) +
    heading('Military Service', rtl) +
    p({text: '{dates} | {role}', bold: true, size: 20, rtl}) +
    p({text: '{details}', size: 20, rtl}) +
    p({text: '{/military_service}', rtl}) +
    heading('Languages', rtl) +
    loop('languages', p({text: '{.}', size: 20, rtl})) +
    heading('Skills', rtl) +
    loop('skills', p({text: '{.}', size: 20, rtl}));

  zip.file('word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + body + '</w:body>' +
    '</w:document>'
  );

  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' }) as Uint8Array;
}

interface ParagraphOpts {
  text: string;
  bold?: boolean;
  size?: number;
  color?: string;
  shading?: string;
  align?: string;
  rtl?: boolean;
}

function p(opts: ParagraphOpts): string {
  let ppr = '';
  if (opts.rtl) ppr += '<w:bidi/>';
  if (opts.align === 'right') ppr += '<w:jc w:val="right"/>';
  else if (opts.align === 'center') ppr += '<w:jc w:val="center"/>';
  if (opts.shading) ppr += `<w:shd w:val="clear" w:color="auto" w:fill="${opts.shading}"/>`;
  const pprXml = ppr ? `<w:pPr>${ppr}</w:pPr>` : '';

  let rpr = '';
  if (opts.bold) rpr += '<w:b/><w:bCs/>';
  if (opts.size) rpr += `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`;
  if (opts.color) rpr += `<w:color w:val="${opts.color}"/>`;
  if (opts.rtl) rpr += '<w:rtl/>';
  const rprXml = rpr ? `<w:rPr>${rpr}</w:rPr>` : '';

  return `<w:p>${pprXml}<w:r>${rprXml}<w:t xml:space="preserve">${escXml(opts.text)}</w:t></w:r></w:p>`;
}

function heading(text: string, rtl: boolean = false): string {
  return p({ text, bold: true, size: 24, color: '1A365D', rtl });
}

function loop(tag: string, inner: string): string {
  return p({ text: `{#${tag}}` }) + inner + p({ text: `{/${tag}}` });
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Load template content for DOCX generation.
 * Returns the raw content that PizZip/Docxtemplater can consume.
 */
export async function loadTemplate(
  style: string | undefined,
  rtl: boolean,
  customFile?: File | null
): Promise<{ content: any; isBinary: boolean }> {
  // User uploaded a custom template
  if (customFile) {
    const ab = await customFile.arrayBuffer();
    return { content: ab, isBinary: false };
  }

  // Named style
  if (style && style !== 'default') {
    try {
      const ab = await loadStyleDocx(style);
      return { content: ab, isBinary: false };
    } catch {
      // Fall through to default
    }
  }

  // Default programmatic template
  const buf = buildDefaultTemplate(rtl);
  return { content: buf, isBinary: false };
}

export interface StyleInfo {
  id: string;
  name: string;
}

export function getAvailableStyles(): StyleInfo[] {
  return [
    { id: 'default', name: 'Default' },
    { id: 'JumpinDefaultHebrew', name: 'Jumpin Hebrew' },
  ];
}
