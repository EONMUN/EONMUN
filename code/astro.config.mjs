// @ts-check

import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import { CACHE_TAGS, PUBLIC_CONTENT_RULE, publicContentRule } from './src/lib/cache.ts';

export default defineConfig({
	site: 'https://eonmun.com',
	output: 'server',
	prefetch: true,
	cache: { provider: cacheCloudflare() },
	routeRules: {
		'/': publicContentRule(CACHE_TAGS.home),
		'/artworks': publicContentRule(CACHE_TAGS.artworks),
		'/artworks/[slug]': PUBLIC_CONTENT_RULE,
		'/collections': publicContentRule(CACHE_TAGS.artworks),
		'/collections/[slug]': PUBLIC_CONTENT_RULE,
		'/posts': publicContentRule(CACHE_TAGS.posts),
		'/posts/[slug]': PUBLIC_CONTENT_RULE,
		'/sitemap.xml': publicContentRule(CACHE_TAGS.sitemap),
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
