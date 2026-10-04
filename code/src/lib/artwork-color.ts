import jpeg from 'jpeg-js';
import type { Env } from '../db';

import { FALLBACK_ARTWORK_COLOR } from './artwork-color-value.ts';
export function averageColor(pixels: Uint8Array) {
 const sum = [0, 0, 0];
 let weight = 0;
 for (let i = 0; i < pixels.length; i += 4) {
  const alpha = pixels[i + 3] / 255;
  weight += alpha;
  for (let c = 0; c < 3; c++) sum[c] += pixels[i + c] * alpha;
 }
 return weight ? '#' + sum.map(v => Math.round(v / weight).toString(16).padStart(2, '0')).join('') : FALLBACK_ARTWORK_COLOR;
}
export async function computeArtworkColor(env: Env, source: string | null): Promise<string | null> {
 if (!source || !env.IMAGES) return null;
 // SECURITY: Only fetch owned media; redirects must not escape this origin.
 const url = new URL(source);
 if (url.origin !== 'https://r2.eonmun.com' || url.username || url.password) return null;
 try {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (!response.ok || !response.body) throw new Error('Cover image unavailable');
  const output = await env.IMAGES.input(response.body).transform({ width: 16, height: 16, fit: 'contain' }).output({ format: 'image/jpeg', quality: 100 });
  const bytes = await output.response().arrayBuffer();
  const decoded = jpeg.decode(new Uint8Array(bytes), { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 8 });
  return averageColor(decoded.data);
 } catch {
  // A failed derivative must not block saving artwork; the next save retries it.
  console.error('Artwork background color calculation failed');
  return null;
 }
}
