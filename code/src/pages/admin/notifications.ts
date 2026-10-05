import type { APIRoute } from "astro";
import { redirectResponse } from "../../lib/redirect";

export const prerender = false;

// Keeps bookmarks, saved-artwork links, and in-flight Google OAuth returns working; the query carries OAuth errors.
export const GET: APIRoute = ({ url }) => redirectResponse(`/admin/settings${url.search}#notifications`, 301);
