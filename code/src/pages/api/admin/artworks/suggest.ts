import type { APIRoute } from 'astro';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { requireAdminMutation } from '../../../../lib/admin-guard';
import { R2_PUBLIC_ORIGIN } from '../../../../lib/media';
import { getRuntimeEnv } from '../../../../lib/runtime-env';

export const prerender = false;

const requestSchema = z.object({
	title: z.string().trim().min(1).max(200),
	artist: z.string().max(200).optional(),
	year: z.string().max(4).optional(),
	description: z.string().max(3000).optional(),
	instructions: z.string().max(1000).optional(),
	images: z.array(z.object({ url: z.string().url(), altText: z.string().max(500).nullable().optional() })).min(1).max(8),
});

const suggestionSchema = z.object({
	description: z.string().min(20).max(300),
	tags: z.array(z.string().min(2).max(40)).min(2).max(8),
	altText: z.string().min(10).max(180),
});

export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ('response' in guard) return guard.response;
	const parsed = requestSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return Response.json({ error: 'Enter a title and valid artwork details.' }, { status: 400 });
	const input = parsed.data;
	if (input.images.some(({ url }) => new URL(url).origin !== R2_PUBLIC_ORIGIN)) {
		return Response.json({ error: 'Only EONMUN artwork images can be used.' }, { status: 400 });
	}
	if (!env.OPENAI_API_KEY) return Response.json({ error: 'AI suggestions are not configured.' }, { status: 503 });
	try {
		const cover = input.images[0];
		const { output } = await generateText({
			model: createOpenAI({ apiKey: env.OPENAI_API_KEY })('gpt-4.1-mini'),
			output: Output.object({ schema: suggestionSchema }),
			system: 'You are an editorial assistant for an artist portfolio. Write accurate, specific, natural copy. Describe visible subject, composition, and color only when supported by the image or supplied facts. Never invent medium, dimensions, location, symbolism, biography, or provenance. Avoid keyword stuffing, sales language, and claims about search ranking. Return one or two sentences under 300 characters describing the work, 2 to 8 useful subject or style tags, and concise alt text describing the visible cover image.',
			messages: [{ role: 'user', content: [
				{ type: 'text', text: JSON.stringify({ title: input.title, artist: input.artist, year: input.year, existingDescription: input.description, editorRequest: input.instructions, existingAltText: cover?.altText }) },
				...(cover ? [{ type: 'image' as const, image: new URL(cover.url) }] : []),
			] }],
			abortSignal: AbortSignal.timeout(30000),
		});
		return Response.json({ suggestion: output }, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return Response.json({ error: 'Could not generate suggestions. Please try again.' }, { status: 502 });
	}
};
