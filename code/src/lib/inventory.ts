export type InventoryStatus = "available" | "unavailable" | "sold";

export interface InventoryRecord {
	artworkSlug: string;
	published: boolean;
	available: boolean;
	sold: boolean;
}

export function toInventoryPayload(record: InventoryRecord) {
	const available = record.published && record.available && !record.sold;
	const status: InventoryStatus = record.sold ? "sold" : available ? "available" : "unavailable";
	return { artworkSlug: record.artworkSlug, available, status };
}

export async function handleInventoryRequest(
	artworkSlug: string,
	lookup: (slug: string) => Promise<InventoryRecord | null>,
) {
	try {
		const record = await lookup(artworkSlug);
		if (!record) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
		return Response.json(toInventoryPayload(record), { headers: { "cache-control": "no-store" } });
	} catch {
		return Response.json(
			{ artworkSlug, available: false, status: "unavailable" },
			{ status: 503, headers: { "cache-control": "no-store" } },
		);
	}
}
