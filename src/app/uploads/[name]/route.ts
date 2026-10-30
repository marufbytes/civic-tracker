import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '../../../lib/uploads';

// Serves legacy local uploads. New uploads are stored as data URLs in the database.
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const m = /^[a-f0-9-]{36}\.(jpg|png|webp|gif)$/.exec(name);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[m[1]],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
