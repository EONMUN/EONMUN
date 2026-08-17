// Response.redirect() returns a response whose headers are immutable, and Astro
// sets headers on whatever a route hands back. On Cloudflare that combination
// throws "TypeError: Can't modify immutable headers" and the redirect reaches
// the browser as a 500. Build redirects by hand so the headers stay mutable.
export function redirectResponse(url: string | URL, status: 301 | 302 | 303 | 307 | 308) {
	return new Response(null, { status, headers: { location: url.toString() } });
}
