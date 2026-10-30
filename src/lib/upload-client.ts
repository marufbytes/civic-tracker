export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const validationError = validateImageFile(file);
  if (validationError) return { error: validationError };

  let compressed: Blob;
  try {
    compressed = await compressImage(file);
  } catch {
    return { error: 'Could not process this image. Please try another photo.' };
  }

  const body = new FormData();
  body.append('file', compressed, 'photo.jpg');
  try {
    const res = await fetch('/api/upload', { method: 'POST', body });
    const data = await res.json();
    if (!res.ok) return { error: typeof data.error === 'string' ? data.error : 'Upload failed.' };
    if (typeof data.url !== 'string' || !data.url.startsWith('data:image/jpeg;base64,')) {
      return { error: 'The server returned an invalid image.' };
    }
    return { url: data.url };
  } catch {
    return { error: 'Upload failed. Check your connection.' };
  }
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 600 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return 'Only JPG, PNG, WebP or GIF images are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}

async function compressImage(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const qualities = [0.82, 0.72, 0.62, 0.52];

    while (scale >= 0.2) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_STORED_IMAGE_BYTES) return blob;
      }

      scale *= 0.8;
    }

    throw new Error('Compressed image is too large.');
  } finally {
    image.close();
  }
}
