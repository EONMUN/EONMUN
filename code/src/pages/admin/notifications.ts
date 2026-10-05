import type { APIRoute } from "astro";
import { redirectResponse } from "../../lib/redirect";

export const prerender = false;

// Keeps bookmarks and saved links to the former page working.
export const GET: APIRoute = ({ url }) => redirectResponse(`/admin/settings${url.search}#notifications`, 301);
