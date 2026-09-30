// @ts-check

import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import { PUBLIC_CONTENT_RULE } from './src/lib/cache.ts';

export default defineConfig({
	site: 'https://eonmun.com',
	output: 'server',
	cache: { provider: cacheCloudflare() },
	routeRules: {
		'/': PUBLIC_CONTENT_RULE,
		'/artworks': PUBLIC_CONTENT_RULE,
		'/artworks/[slug]': PUBLIC_CONTENT_RULE,
		'/posts': PUBLIC_CONTENT_RULE,
		'/posts/[slug]': PUBLIC_CONTENT_RULE,
		'/sitemap.xml': PUBLIC_CONTENT_RULE,
		'/sitemap-index.xml': PUBLIC_CONTENT_RULE,
	},
	image: { domains: ['r2.eonmun.com'] },
	integrations: [mdx()],
	server: {
		host: true,
		allowedHosts: true,
	},

	vite: {
		plugins: [tailwindcss()],
		server: { strictPort: true },
	},

	adapter: cloudflare({
		imageService: 'cloudflare-binding',
	}),
});
