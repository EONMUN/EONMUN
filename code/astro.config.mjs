// @ts-check

import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

/**
 * Append a stub `DOQueueHandler` export to the built worker entry so
 * astro previews can upload as versions of the legacy `eonmun` worker.
 *
 * Background: the legacy Next.js + OpenNext worker registers a Durable
 * Object class `DOQueueHandler` (for ISR cache queueing). Cloudflare
 * blocks `wrangler versions upload` if a new version drops a DO class
 * with persisted instances — the only legitimate alternatives are a
 * rename-class migration (we have nothing to rename to) or a
 * delete-class migration (which would destroy production DO state).
 *
 * Solution: re-export a no-op class with the same name from the astro
 * entry. The class is exported but unbound by astro's wrangler.jsonc;
 * production traffic still hits the Next.js version with the real
 * impl. When we eventually promote astro to production we'll need a
 * `delete-class` migration to wind the DO down cleanly.
 *
 * The adapter ({@link https://docs.astro.build/en/guides/integrations-guide/cloudflare/})
 * has no documented API for adding named exports to its built worker
 * entrypoint, hence the post-build patch.
 */
function doQueueStubIntegration() {
	return {
		name: 'do-queue-stub',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const { writeFile, readFile, access } = await import('node:fs/promises');
				const { fileURLToPath } = await import('node:url');
				const path = await import('node:path');

				// `dir` for the @astrojs/cloudflare adapter points to dist/client.
				// The server entry lives in a sibling `server/` directory.
				const dirPath = fileURLToPath(dir);
				const distDir = path.dirname(dirPath.replace(/\/$/, ''));
				const serverDir = path.join(distDir, 'server') + '/';
				const stubPath = serverDir + 'do-queue-stub.mjs';
				const entryPath = serverDir + 'entry.mjs';

				try {
					await access(entryPath);
				} catch {
					logger.warn(`do-queue-stub: ${entryPath} not found; skipping injection`);
					return;
				}

				await writeFile(
					stubPath,
					`import { DurableObject } from 'cloudflare:workers';\n` +
						`export class DOQueueHandler extends DurableObject {\n` +
						`	async fetch() {\n` +
						`		return new Response('DOQueueHandler is not implemented in the astro version', { status: 501 });\n` +
						`	}\n` +
						`}\n`,
				);

				let entry = await readFile(entryPath, 'utf8');
				if (!entry.includes('DOQueueHandler')) {
					entry += `\nexport { DOQueueHandler } from './do-queue-stub.mjs';\n`;
					await writeFile(entryPath, entry);
				}
			},
		},
	};
}

// `output: 'server'` makes routes SSR by default. Pages that should be
// prerendered must opt in with `export const prerender = true` (the homepage,
// /about, /contact). SSR routes set their own `Cache-Control` headers so
// the Cloudflare edge can cache the response — see `src/lib/cache.ts`.
export default defineConfig({
	site: 'https://eonmun.com',
	output: 'server',
	integrations: [mdx(), doQueueStubIntegration()],
	server: {
		host: true,
		allowedHosts: true,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
