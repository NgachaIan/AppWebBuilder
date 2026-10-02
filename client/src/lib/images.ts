/** Read an uploaded image, downscale it and return a compact data URL. */
export async function fileToDataUrl(file: File, maxSize = 1600, quality = 0.84): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(file);
  });
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return raw;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not load the image'));
    i.src = raw;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const out = canvas.toDataURL(type, quality);
  // PNG photos can get huge; fall back to JPEG if it's not smaller
  if (type === 'image/png' && out.length > raw.length) return canvas.toDataURL('image/jpeg', quality);
  return out;
}
