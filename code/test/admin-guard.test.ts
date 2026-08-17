import { describe, expect, test } from "bun:test";
import { isSameOriginRequest, mutationError, requireAdminMutation, requireAdminPage } from "../src/lib/admin-guard";

const env = {
	AUTH_SECRET: "test-secret-that-is-long-enough",
	AUTH_GOOGLE_ID: "test-client-id",
	AUTH_GOOGLE_SECRET: "test-client-secret",
	ADMIN_EMAILS: "admin@example.com",
};

describe("admin request guards", () => {
	test("rejects cross-origin mutations", async () => {
		const request = new Request("https://eonmun.test/api/admin/artworks", { method: "POST", headers: { origin: "https://evil.test" } });
		expect(isSameOriginRequest(request)).toBe(false);
		const result = await requireAdminMutation(request, env);
		expect("response" in result ? result.response.status : 0).toBe(403);
	});

	test("rejects an unauthenticated same-origin API request", async () => {
		const request = new Request("https://eonmun.test/api/admin/artworks", { method: "POST", headers: { origin: "https://eonmun.test" } });
		const result = await requireAdminMutation(request, env);
		expect("response" in result ? result.response.status : 0).toBe(401);
	});

	test("redirects unauthenticated artwork and collection admin pages", async () => {
		for (const path of ["/admin/artworks/new", "/admin/collections/example"]) {
			const result = await requireAdminPage(new Request(`https://eonmun.test${path}`), env, path);
			expect("response" in result ? result.response.status : 0).toBe(302);
			expect("response" in result ? result.response.headers.get("location") : "").toContain(encodeURIComponent(path));
		}
	});

	test("sends an unauthenticated dashboard request to sign-in", async () => {
		const result = await requireAdminPage(new Request("https://eonmun.test/admin"), env, "/admin");
		expect("response" in result).toBe(true);
		const response = ("response" in result ? result.response : null)!;
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toContain("/api/auth/signin");
	});

	test("keeps invalid slug syntax as a validation error", async () => {
		const response = mutationError(new Error("Slug must use lowercase letters, numbers, and hyphens"));
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Slug must use lowercase letters, numbers, and hyphens" });
	});

	test("returns a conflict for a unique slug collision", async () => {
		const response = mutationError(new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed: artworks.slug"));
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "Slug already exists" });
	});
});
