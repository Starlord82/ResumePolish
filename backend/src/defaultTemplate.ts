import PizZip from 'pizzip';

/**
 * Builds a minimal .docx buffer containing docxtemplater placeholders.
 * Used when the user downloads without uploading a custom template.
 */
export function buildDefaultTemplateBuffer(): Buffer {
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

  // Build the document body with docxtemplater placeholders
  const body =
    p({text: '{name}', bold: true, size: 32}) +
    p({text: '{title}', color: '666666', size: 24}) +
    p({text: ''}) +
    p({text: '{summary}', size: 20}) +
    p({text: ''}) +
    heading('Experience') +
    loop('experience',
      p({text: '{role} — {company} ({dates})', bold: true, size: 20}) +
      loop('bullets', p({text: '{.}', size: 20}))
    ) +
    heading('Projects') +
    loop('projects',
      p({text: '{name} ({dates})', bold: true, size: 20}) +
      loop('bullets', p({text: '{.}', size: 20}))
    ) +
    heading('Education') +
    loop('education',
      p({text: '{degree} — {institution} ({dates})', size: 20})
    ) +
    heading('Skills') +
    loop('skills', p({text: '{.}', size: 20}));

  zip.file('word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + body + '</w:body>' +
    '</w:document>'
  );

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

function p(opts: { text: string; bold?: boolean; size?: number; color?: string }): string {
  let rpr = '';
  if (opts.bold) rpr += '<w:b/>';
  if (opts.size) rpr += `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`;
  if (opts.color) rpr += `<w:color w:val="${opts.color}"/>`;
  const rprXml = rpr ? `<w:rPr>${rpr}</w:rPr>` : '';
  return `<w:p><w:r>${rprXml}<w:t xml:space="preserve">${escXml(opts.text)}</w:t></w:r></w:p>`;
}

function heading(text: string): string {
  return p({ text, bold: true, size: 24, color: '1A365D' });
}

function loop(tag: string, inner: string): string {
  return p({ text: `{#${tag}}` }) + inner + p({ text: `{/${tag}}` });
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
