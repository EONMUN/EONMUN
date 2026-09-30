import { getImage } from 'astro:assets';

export interface ResponsiveImageOptions {
	width: number;
	height?: number;
	widths: number[];
	sizes: string;
}

export interface ResponsiveImageSource {
	src: string;
	srcset?: string;
	sizes?: string;
	width?: number;
	height?: number;
	fallback?: string;
}

const MEDIA_ORIGIN = 'https://r2.eonmun.com';

export async function getResponsiveImageSource(
	src: string,
	options: ResponsiveImageOptions,
): Promise<ResponsiveImageSource> {
	let url: URL;
	try {
		url = new URL(src);
	} catch {
		return { src };
	}
	if (url.origin !== MEDIA_ORIGIN) return { src };

	try {
		const image = await getImage({
			src,
			width: options.width,
			...(options.height ? { height: options.height } : {}),
			widths: options.widths,
			sizes: options.sizes,
			format: 'webp',
			quality: 75,
			fit: 'scale-down',
		});
		return {
			src: image.src,
			srcset: image.srcSet.attribute || undefined,
			sizes: options.sizes,
			width: Number(image.attributes.width) || undefined,
			height: Number(image.attributes.height) || undefined,
			fallback: src,
		};
	} catch (error) {
		console.error('image optimization failed', error);
		return { src };
	}
}
