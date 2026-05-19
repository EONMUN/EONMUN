// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// `output: 'server'` makes routes SSR by default. Pages that should be
// prerendered must opt in with `export const prerender = true` (the homepage,
// /about, /contact). SSR routes set their own `Cache-Control` headers so
// the Cloudflare edge can cache the response — see `src/lib/cache.ts`.
export default defineConfig({
	site: 'https://eonmun.com',
	output: 'server',
	integrations: [mdx(), sitemap()],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
