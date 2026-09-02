const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.85;

// Downscales to a max long edge and re-encodes as JPEG to cut Gemini token cost.
export function resizeImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}