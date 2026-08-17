// Shared by admin input validation and the public checkout endpoint.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Derives a slug from a display name so a caller that has only a name does not
// have to ask for both. Accents are folded rather than dropped, so "Étude"
// keeps its letters instead of becoming "tude".
export function slugify(value: string) {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
