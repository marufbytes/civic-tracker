import 'server-only';
import { randomUUID } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const UPLOAD_URL_RE = /^\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp|gif)$/;

/** Detect image type from magic bytes (never trust client MIME / filename). */
function sniff(buf: Buffer): 'jpg' | 'png' | 'webp' | 'gif' | null {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'gif';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  }
  return null;
}

export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: 'The file is empty.' };
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Image must be 5 MB or smaller.' };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: 'Only JPG, PNG, WebP or GIF images are allowed.' };
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}


/** Only accept URLs produced by our own upload endpoint, and make sure the file exists. */
export async function validUploadUrl(url: string): Promise<boolean> {
  if (!UPLOAD_URL_RE.test(url)) return false;
  try {
    await access(path.join(UPLOAD_DIR, path.basename(url)));
    return true;
  } catch {
    return false;
  }
}

