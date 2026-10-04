export const FALLBACK_ARTWORK_COLOR = '#f5f1e8';
export function artworkColor(value: string | null | undefined) {
 return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : FALLBACK_ARTWORK_COLOR;
}
