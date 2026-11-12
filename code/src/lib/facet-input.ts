import { artworkAttributes } from "./artwork-facets";
import { slugify } from "./slug";

export const editableFacetKeys = [
	"tag",
	...artworkAttributes.map((field) => field.key),
];
export function isEditableFacet(facet: { namespace: string; key: string }) {
	return facet.namespace === "artwork" && editableFacetKeys.includes(facet.key);
}
export function facetId(value: unknown) {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0)
		throw new Error("Invalid facet ID");
	return value;
}
export function facetValue(value: unknown, key: string) {
	if (typeof value !== "string") throw new Error("Value must be text");
	const normalized = value.trim();
	if (!normalized || normalized.length > (key === "tag" ? 40 : 80))
		throw new Error(
			`Value must contain 1–${key === "tag" ? 40 : 80} characters`,
		);
	if (key === "tag" && !slugify(normalized))
		throw new Error("Tag must contain letters or numbers");
	return normalized;
}
export type FacetMutation =
	| { action: "create"; key: string; value: unknown }
	| { action: "rename"; id: number; value: unknown }
	| { action: "merge"; id: number; targetId: number }
	| { action: "delete"; id: number }
	| { action: "mergeMany"; id: number; sourceIds: number[] };
export function parseFacetMutation(payload: unknown): FacetMutation {
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		throw new Error("Invalid facet payload");
	const input = payload as Record<string, unknown>;
	if (input.action === "create") {
		if (typeof input.key !== "string" || !editableFacetKeys.includes(input.key))
			throw new Error("This facet category is read-only");
		return {
			action: "create",
			key: input.key,
			value: facetValue(input.value, input.key),
		};
	}
	const id = facetId(input.id);
	if (input.action === "mergeMany")
		return {
			action: "mergeMany",
			id,
			sourceIds: facetSourceIds(input.sourceIds),
		};
	if (input.action === "rename")
		return { action: "rename", id, value: input.value };
	if (input.action === "merge")
		return { action: "merge", id, targetId: facetId(input.targetId) };
	if (input.action === "delete") return { action: "delete", id };
	throw new Error("Invalid facet action");
}

export function facetSourceIds(value: unknown) {
	if (!Array.isArray(value) || !value.length || value.length > 20)
		throw new Error("Choose between 1 and 20 source values");
	return [...new Set(value.map(facetId))];
}
export function parseFacetMergeQuery(params: URLSearchParams) {
	const values = params.getAll("merge");
	if (!values.length) return [];
	return facetSourceIds(
		values.map((value) => {
			if (!/^[1-9]\d*$/.test(value)) throw new Error("Invalid merge facet ID");
			return facetId(Number(value));
		}),
	);
}
