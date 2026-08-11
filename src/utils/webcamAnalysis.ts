/**
 * Lightweight, dependency-free face-detection & identity-matching helpers used by
 * the exam proctoring UI (WebcamVerification + during-exam monitoring).
 *
 * These are heuristic pixel analyses (skin-tone segmentation + connected
 * components + tone-histogram comparison) — they intentionally do NOT pull in a
 * heavy ML face-recognition model. Accuracy is best-effort and primarily useful
 * for *presence / multiplicity* checks and a *soft* identity similarity hint.
 */

/** Result of an identity verification attempt against a registered photo. */
export interface WebcamVerificationResult {
  faceDetected: boolean;
  faceCount: number;
  photoAvailable: boolean;
  identityMatch: boolean;
  confidence: number | null; // 0..100 tone-similarity score; null when not computable
  method: 'auto' | 'manual';
  verifiedAt: string;
}

const GRID_W = 48;
const GRID_H = 32;
// Minimum connected skin blob (in grid cells) to count as a face.
// 48x32 = 1536 cells; ~8% of the frame is a reasonable lower bound for a face.
const MIN_FACE_BLOB_CELLS = 120;
const SKIN_SAMPLES = 62; // squared sample grids for histograms

/** Classic heuristic skin-tone classification (RGB). */
export function isSkinPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  return (
    r > 45 &&
    g > 25 &&
    b > 20 &&
    r >= g &&
    g >= b &&
    delta > 12 &&
    r - g >= 8 &&
    max > 80 &&
    max < 250
  );
}

/**
 * Analyses a video frame at a low grid resolution and returns whether a face is
 * present and how many face-sized skin blobs were found.
 */
export function analyzeVideoFrame(
  video: HTMLVideoElement
): { facePresent: boolean; faceCount: number } {
  if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
    return { facePresent: false, faceCount: 0 };
  }

  const canvas = document.createElement('canvas');
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { facePresent: false, faceCount: 0 };

  try {
    ctx.drawImage(video, 0, 0, GRID_W, GRID_H); // squashes to grid — fine for presence
    const { data } = ctx.getImageData(0, 0, GRID_W, GRID_H);
    const skin = new Uint8Array(GRID_W * GRID_H);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      skin[p] = isSkinPixel(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
    }

    const { faceCount, largest } = countSkinBlobs(skin, GRID_W, GRID_H);
    return { facePresent: largest >= MIN_FACE_BLOB_CELLS, faceCount };
  } catch {
    return { facePresent: false, faceCount: 0 };
  }
}

/** Connected-component labelling (BFS) over the skin grid. */
function countSkinBlobs(
  skin: Uint8Array,
  w: number,
  h: number,
  minCells: number = MIN_FACE_BLOB_CELLS
): { faceCount: number; largest: number } {
  const visited = new Uint8Array(w * h);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let largest = 0;
  let faceCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!skin[idx] || visited[idx]) continue;

      let size = 0;
      const queue: number[] = [idx];
      visited[idx] = 1;
      while (queue.length) {
        const cur = queue.pop() as number;
        size++;
        const cx = cur % w;
        const cy = (cur / w) | 0;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (!skin[ni] || visited[ni]) continue;
          visited[ni] = 1;
          queue.push(ni);
        }
      }

      if (size > largest) largest = size;
      if (size >= minCells) faceCount++;
    }
  }

  return { faceCount, largest };
}
/** Captures the current video frame centre-cropped to a square sample canvas. */
export function captureFrameForCompare(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  size: number = SKIN_SAMPLES
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const sw =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLImageElement
        ? source.naturalWidth
        : source.width;
  const sh =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLImageElement
        ? source.naturalHeight
        : source.height;
  if (!sw || !sh) return null;

  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  return canvas;
}

/** Loads an image with CORS enabled so pixels can be read (when the host allows). */
export function loadImageCors(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

/** Builds a normalised histogram of skin-pixel hues (0–360 split into 18 bins). */
export function buildSkinHueHistogram(
  canvas: HTMLCanvasElement
): number[] | null {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hist = new Array(18).fill(0);
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isSkinPixel(r, g, b)) continue;
      const hue = rgbToHue(r, g, b);
      hist[Math.min(17, Math.floor(hue / 20))]++;
      total++;
    }

    if (total === 0) return null;
    for (let i = 0; i < hist.length; i++) hist[i] /= total;
    return hist;
  } catch {
    // Canvas is tainted (cross-origin photo) — pixels unavailable.
    return null;
  }
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

/** Histogram intersection similarity in 0..1 (both arrays must sum to ~1). */
export function histogramIntersection(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += Math.min(a[i], b[i]);
  }
  return sum;
}

/** Compares a live capture against a registered photo and returns a 0..100 score or null. */
export function computeIdentityConfidence(
  liveCanvas: HTMLCanvasElement,
  photoCanvas: HTMLCanvasElement
): number | null {
  const liveHist = buildSkinHueHistogram(liveCanvas);
  const photoHist = buildSkinHueHistogram(photoCanvas);
  if (!liveHist || !photoHist) return null;
  return Math.round(histogramIntersection(liveHist, photoHist) * 100);
}