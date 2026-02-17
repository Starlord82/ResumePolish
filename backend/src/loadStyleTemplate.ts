import fs from 'fs';
import path from 'path';
import { buildDefaultTemplateBuffer } from './defaultTemplate';

/**
 * Resolve the resources directory.
 * At runtime __dirname is dist/, resources are in src/resources/ (sibling).
 */
function getResourcesDir(): string {
  const fromDist = path.join(__dirname, '..', 'src', 'resources');
  if (fs.existsSync(fromDist)) return fromDist;
  const fallback = path.join(__dirname, 'resources');
  if (fs.existsSync(fallback)) return fallback;
  return fromDist;
}

/**
 * Load the template content for a given style.
 * Priority: uploaded file > named style > default.
 */
export function loadStyleTemplate(style: string | undefined, rtl: boolean): string | Buffer {
  if (!style || style === 'default') {
    return buildDefaultTemplateBuffer(rtl);
  }

  const resourcePath = path.join(getResourcesDir(), `${style}.docx`);
  if (fs.existsSync(resourcePath)) {
    return fs.readFileSync(resourcePath, 'binary');
  }

  return buildDefaultTemplateBuffer(rtl);
}
