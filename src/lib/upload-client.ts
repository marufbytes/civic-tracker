export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const body = new FormData();
  body.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body });
    const data = await res.json();
    return res.ok ? { url: data.url as string } : { error: (data.error as string) ?? 'Upload failed.' };
  } catch {
    return { error: 'Upload failed. Check your connection.' };
  }
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}

