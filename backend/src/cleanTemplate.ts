/**
 * One-time script: replaces content in JumpinDefaultHebrew.docx with
 * docxtemplater placeholders while preserving all styling, fonts, and images.
 *
 * Run: npx ts-node src/cleanTemplate.ts
 */
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

// Use the ORIGINAL template (with data) as source for shape/fonts
const ORIGINAL_PATH = path.join(__dirname, '..', '..', 'frontend', 'resources', 'טמפלט קורות חיים בעברית (1).docx');
const OUTPUT_PATH = path.join(__dirname, 'resources', 'JumpinDefaultHebrew.docx');

const NS =
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:w10="urn:schemas-microsoft-com:office:word" ' +
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" ' +
  'xmlns:sl="http://schemas.openxmlformats.org/schemaLibrary/2006/main" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ' +
  'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" ' +
  'xmlns:lc="http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas" ' +
  'xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
  'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" ' +
  'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ' +
  'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" ' +
  'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Run properties
function rpr(opts: { font?: string; bold?: boolean; color?: string; size?: number; rtl?: boolean }): string {
  const f = opts.font || 'Assistant';
  let xml = '<w:rPr>';
  xml += `<w:rFonts w:ascii="${f}" w:cs="${f}" w:eastAsia="${f}" w:hAnsi="${f}"/>`;
  if (opts.bold) xml += '<w:b w:val="1"/><w:bCs w:val="1"/>';
  if (opts.color) xml += `<w:color w:val="${opts.color}"/>`;
  if (opts.size) xml += `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`;
  if (opts.rtl) xml += '<w:rtl w:val="1"/>';
  xml += '</w:rPr>';
  return xml;
}

// Paragraph properties
function ppr(opts: { bidi?: boolean; after?: number; before?: number; border?: boolean; indent?: boolean; rprDefault?: string }): string {
  let xml = '<w:pPr>';
  if (opts.bidi) xml += '<w:bidi w:val="1"/>';
  xml += `<w:spacing w:after="${opts.after ?? 40}" w:before="${opts.before ?? 0}" w:line="240" w:lineRule="auto"/>`;
  if (opts.border) xml += '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="000041"/></w:pBdr>';
  if (opts.indent) xml += '<w:ind w:left="360" w:hanging="180"/>';
  if (opts.rprDefault) xml += opts.rprDefault;
  xml += '</w:pPr>';
  return xml;
}

function p(pprXml: string, rprXml: string, text: string): string {
  return `<w:p>${pprXml}<w:r>${rprXml}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function extractBackgroundShape(xml: string): string {
  const start = xml.indexOf('<mc:AlternateContent>');
  const end = xml.indexOf('</mc:AlternateContent>') + '</mc:AlternateContent>'.length;
  return (start >= 0 && end > start) ? xml.substring(start, end) : '';
}

function extractSectPr(xml: string): string {
  const match = xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  return match ? match[0] : '<w:sectPr><w:pgSz w:h="16838" w:w="11906" w:orient="portrait"/><w:pgMar w:bottom="720" w:top="720" w:left="720" w:right="720" w:header="708" w:footer="708"/></w:sectPr>';
}

function main() {
  const buf = fs.readFileSync(ORIGINAL_PATH);
  const zip = new PizZip(buf);
  const originalXml = zip.file('word/document.xml')!.asText();

  // Extract the full-width blue background shape (positioned behind text, page-relative)
  const bgShape = extractBackgroundShape(originalXml);
  // Extract section properties (page size, margins)
  const sectPr = extractSectPr(originalXml);

  // Style shortcuts
  const rprName = rpr({ bold: true, color: 'ffffff', size: 36, rtl: true });
  const rprTitle = rpr({ bold: true, color: 'ffffff', size: 28, rtl: true });
  const rprContact = rpr({ color: 'ffffff', size: 24, rtl: true });
  const rprHeading = rpr({ bold: true, color: '181717', size: 26, rtl: true });
  const rprSubhead = rpr({ bold: true, color: '181717', size: 28, rtl: true });
  const rprBody = rpr({ color: '181717', size: 26, rtl: true });
  const rprBodySm = rpr({ color: '181717', size: 24, rtl: true });
  const rprHeaderDefault = rpr({ color: 'f3f3f3', size: 24 });

  const pprHeader = ppr({ bidi: true, after: 40, rprDefault: rprHeaderDefault });
  const pprSection = ppr({ bidi: true, after: 80, before: 240, border: true, rprDefault: rprHeading });
  const pprBodyP = ppr({ bidi: true, after: 40, rprDefault: rprBody });
  const pprSub = ppr({ bidi: true, after: 40, before: 160, rprDefault: rprSubhead });
  const pprBullet = ppr({ bidi: true, after: 40, indent: true, rprDefault: rprBodySm });

  const body =
    // First paragraph: background shape (behind text) + name | title
    `<w:p>${pprHeader}` +
    // Shape run — the shape is an anchor positioned behind text at page level
    // It must be inside a <w:r> with its own rPr (matching the first text run)
    (bgShape ? `<w:r>${rprName}${bgShape}</w:r>` : '') +
    // Name text
    `<w:r>${rprName}<w:t xml:space="preserve">{name}</w:t></w:r>` +
    // Separator + Title
    `<w:r>${rprTitle}<w:t xml:space="preserve"> | {title}</w:t></w:r>` +
    `</w:p>` +

    // Contact line (over the blue background shape)
    p(pprHeader, rprContact, '{phone} | {email} | {linkedin}') +

    // Spacer
    p(pprBodyP, rprBody, '') +

    // Summary
    p(pprBodyP, rprBody, '{summary}') +

    // Education (dynamic heading)
    p(pprSection, rprHeading, '{education_heading}') +
    p(pprBodyP, rprBodySm, '{#education}') +
    p(pprSub, rprSubhead, '{dates} | {degree} — {institution}') +
    p(pprBullet, rprBodySm, '{#bullets}') +
    p(pprBullet, rprBodySm, '• {.}') +
    p(pprBullet, rprBodySm, '{/bullets}') +
    p(pprBodyP, rprBodySm, '{/education}') +

    // Experience (dynamic heading)
    p(pprSection, rprHeading, '{experience_heading}') +
    p(pprBodyP, rprBodySm, '{#experience}') +
    p(pprSub, rprSubhead, '{dates} | {role} — {company}') +
    p(pprBullet, rprBodySm, '{#bullets}') +
    p(pprBullet, rprBodySm, '• {.}') +
    p(pprBullet, rprBodySm, '{/bullets}') +
    p(pprBodyP, rprBodySm, '{/experience}') +

    // Projects (dynamic heading)
    p(pprSection, rprHeading, '{projects_heading}') +
    p(pprBodyP, rprBodySm, '{#projects}') +
    p(pprSub, rprSubhead, '{name} ({dates})') +
    p(pprBullet, rprBodySm, '{#bullets}') +
    p(pprBullet, rprBodySm, '• {.}') +
    p(pprBullet, rprBodySm, '{/bullets}') +
    p(pprBodyP, rprBodySm, '{/projects}') +

    // Military service (conditional, dynamic heading)
    p(pprBodyP, rprBodySm, '{#military_service}') +
    p(pprSection, rprHeading, '{military_heading}') +
    p(pprSub, rprSubhead, '{dates} | {role}') +
    p(pprBodyP, rprBodySm, '{details}') +
    p(pprBodyP, rprBodySm, '{/military_service}') +

    // Languages (dynamic heading)
    p(pprSection, rprHeading, '{languages_heading}') +
    p(pprBodyP, rprBodySm, '{#languages}') +
    p(pprBodyP, rprBodySm, '• {.}') +
    p(pprBodyP, rprBodySm, '{/languages}') +

    // Skills (dynamic heading)
    p(pprSection, rprHeading, '{skills_heading}') +
    p(pprBodyP, rprBodySm, '{#skills}') +
    p(pprBodyP, rprBodySm, '• {.}') +
    p(pprBodyP, rprBodySm, '{/skills}');

  const newXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document ${NS}>` +
    `<w:body>${body}${sectPr}</w:body>` +
    `</w:document>`;

  zip.file('word/document.xml', newXml);

  const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`Template cleaned and saved to: ${OUTPUT_PATH}`);
  console.log(`Size: ${output.length} bytes`);
}

main();
