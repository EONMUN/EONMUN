export interface ArtworkFacet { namespace: string; key: string; value: string; }

export const artworkAttributes = [
 { name: 'materials', key: 'material', label: 'Materials', group: 'Materials and surface' },
 { name: 'supports', key: 'support', label: 'Surface', group: 'Materials and surface' },
 { name: 'mediums', key: 'medium', label: 'Medium', group: 'Materials and surface' },
 { name: 'subjects', key: 'subject', label: 'Subjects', group: 'Subject and style' },
 { name: 'styles', key: 'style', label: 'Styles', group: 'Subject and style' },
 { name: 'colors', key: 'color', label: 'Colors', group: 'Subject and style' },
] as const;
export type ArtworkAttribute = typeof artworkAttributes[number]['name'];
export type ArtworkAttributes = Record<ArtworkAttribute, string[]>;
export const managedArtworkKeys = new Set<string>(['tag', 'orientation', ...artworkAttributes.map(field => field.key)]);

export interface ArtworkMeasurements { width: number | null; height: number | null; depth: number | null; dimensionUnit: 'in' | 'cm'; }
export function dimensionOrientation({ width, height }: Pick<ArtworkMeasurements, 'width' | 'height'>) {
 if (width === null || height === null || width <= 0 || height <= 0) return null;
 return width === height ? 'Square' : height > width ? 'Portrait' : 'Landscape';
}

export function artworkOrientation(artwork: Pick<ArtworkMeasurements, 'width' | 'height'> & { facets: ArtworkFacet[] }) {
 return dimensionOrientation(artwork) ?? artwork.facets.find(f => f.namespace === 'artwork' && f.key === 'orientation')?.value ?? null;
}
