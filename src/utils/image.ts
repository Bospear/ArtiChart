export interface ToImageOptions {
  backgroundColor?: string;
  width?: number;
  height?: number;
  quality?: number;
  type?: 'image/png' | 'image/jpeg' | 'image/svg+xml';
}

export async function toImage(
  element: HTMLElement,
  options: ToImageOptions = {},
): Promise<string> {
  const {
    backgroundColor = '#ffffff',
    width,
    height,
    quality = 1,
    type = 'image/png',
  } = options;

  const rect = element.getBoundingClientRect();
  const w = width ?? rect.width;
  const h = height ?? rect.height;

  const canvas = document.createElement('canvas');
  canvas.width = w * window.devicePixelRatio;
  canvas.height = h * window.devicePixelRatio;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, w, h);

  const svgData = new XMLSerializer().serializeToString(element);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(type, quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render image'));
    };
    img.src = url;
  });
}

export async function downloadImage(
  element: HTMLElement,
  filename: string = 'artichart.png',
  options: ToImageOptions = {},
): Promise<void> {
  const dataUrl = await toImage(element, options);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function toSvgString(element: HTMLElement): string {
  return new XMLSerializer().serializeToString(element);
}
