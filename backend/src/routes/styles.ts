import { Request, Response } from 'express';

export interface StyleInfo {
  id: string;
  name: string;
}

const STYLES: StyleInfo[] = [
  { id: 'default', name: 'Default' },
  { id: 'JumpinDefaultHebrew', name: 'Jumpin Hebrew' },
];

export function getStylesHandler(_req: Request, res: Response) {
  res.json(STYLES);
}

export function getAvailableStyleIds(): string[] {
  return STYLES.map(s => s.id);
}
