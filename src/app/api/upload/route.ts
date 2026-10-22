import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { saveImage } from '../../../lib/uploads';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in to upload images.' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const res = await saveImage(file);
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ url: res.url });
}

