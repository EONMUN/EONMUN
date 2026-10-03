export interface ArtworkFacet {
	namespace: string;
	key: string;
	value: string;
}

export const dimensionKeys = new Set(["width", "height", "depth", "dimension-unit"]);
const singleValueKeys = new Set([...dimensionKeys, "size", "orientation"]);

export function validateArtworkFacet(facet: ArtworkFacet) {
	if (facet.namespace !== "artwork") return;
	if (["width", "height", "depth"].includes(facet.key)
		&& (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/.test(facet.value.toLowerCase()) || !Number.isFinite(Number(facet.value)))) {
		throw new Error(`${facet.key} must be a non-negative number`);
	}
	if (facet.key === "dimension-unit" && !["in", "cm"].includes(facet.value)) {
		throw new Error("dimension-unit must be in or cm");
	}
}

export function artworkMeasurements(facets: ArtworkFacet[]) {
	const value = (key: string) => facets.find((facet) => facet.namespace === "artwork" && facet.key === key)?.value;
	return { width: value("width"), height: value("height"), depth: value("depth"), unit: value("dimension-unit") };
}

export function normalizeArtworkFacets(facets: ArtworkFacet[]): ArtworkFacet[] {
	const result = facets.map((facet) => {
		validateArtworkFacet(facet);
		return facet.namespace === "artwork" && ["width", "height", "depth"].includes(facet.key)
			? { ...facet, value: String(Number(facet.value)) } : facet;
	});
	const seen = new Map<string, string>();
	for (const facet of result) {
		validateArtworkFacet(facet);
		if (facet.namespace !== "artwork" || !singleValueKeys.has(facet.key)) continue;
		const prior = seen.get(facet.key);
		if (prior !== undefined && prior.toLowerCase() !== facet.value.toLowerCase()) {
			throw new Error(`Choose only one ${facet.key} value`);
		}
		seen.set(facet.key, facet.value);
	}
	const { width, height, depth, unit } = artworkMeasurements(result);
	if ([width, height, depth].some((value) => value !== undefined) && !unit) {
		throw new Error("Add a dimension-unit facet (in or cm) for measurements");
	}
	if (width !== undefined && height !== undefined && Number(width) > 0 && Number(height) > 0) {
		const longestCm = Math.max(Number(width), Number(height)) * (unit === "in" ? 2.54 : 1);
		const derived = {
			size: longestCm <= 50 ? "Small" : longestCm <= 100 ? "Medium" : "Large",
			orientation: Number(width) === Number(height) ? "Square" : Number(height) > Number(width) ? "Portrait" : "Landscape",
		};
		return [...result.filter((facet) => facet.namespace !== "artwork" || !["size", "orientation"].includes(facet.key)),
			...Object.entries(derived).map(([key, value]) => ({ namespace: "artwork", key, value }))];
	}
	return result;
}
