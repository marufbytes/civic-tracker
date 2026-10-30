import 'server-only';
import path from 'node:path';

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
export const MAX_STORED_IMAGE_BYTES = 600 * 1024;

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
  if (file.size > MAX_STORED_IMAGE_BYTES) return { error: 'Compressed image must be 600 KB or smaller.' };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (ext !== 'jpg') return { error: 'Image could not be processed. Please choose another photo.' };
  return { url: `data:image/jpeg;base64,${buf.toString('base64')}` };
}

/** Only accept bounded JPEG data URLs matching the format produced by the upload endpoint. */
export function validImageDataUrl(dataUrl: string): boolean {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  const maxEncodedLength = Math.ceil(MAX_STORED_IMAGE_BYTES / 3) * 4;
  if (!match || match[1].length > maxEncodedLength || match[1].length % 4 !== 0) return false;

  const image = Buffer.from(match[1], 'base64');
  return image.length > 0 && image.length <= MAX_STORED_IMAGE_BYTES && sniff(image) === 'jpg';
}
