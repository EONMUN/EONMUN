import type { PostHog } from 'posthog-js';

type AnalyticsClient = Pick<PostHog, 'capture' | 'identify' | 'reset' | 'get_property'>;

export async function startAnalytics(client: AnalyticsClient) {
	const capture = (event: string, properties: Record<string, string>) => {
		// Navigation must not discard the click or delay checkout submission.
		client.capture(event, { source_path: location.pathname, ...properties }, {
			transport: 'sendBeacon',
			send_instantly: true,
		});
	};

	document.addEventListener('click', (event) => {
		if (!(event.target instanceof Element)) return;
		const link = event.target.closest('a[href]');
		if (!(link instanceof HTMLAnchorElement)) return;
		const target = new URL(link.href);
		if (target.origin !== location.origin) return;
		const match = target.pathname.match(/^\/(posts|artworks)\/([^/]+)\/?$/);
		if (!match) return;
		const kind = match[1] === 'posts' ? 'post' : 'artwork';
		capture(`${kind}_clicked`, {
			[`${kind}_slug`]: decodeURIComponent(match[2]),
			destination_path: target.pathname,
		});
	});

	document.addEventListener('submit', (event) => {
		const form = event.target;
		if (!(form instanceof HTMLFormElement) || !form.matches('[data-buy-form]')) return;
		const slug = new FormData(form).get('artworkSlug');
		if (typeof slug === 'string') capture('checkout_started', { artwork_slug: slug });
	});

	try {
		const response = await fetch('/api/auth/session', {
			credentials: 'same-origin',
			cache: 'no-store',
			signal: AbortSignal.timeout(3000),
		});
		if (response.ok) {
			const session = await response.json();
			if (typeof session?.user?.id === 'string' && session.user.id) {
				client.identify(session.user.id, {
					email: session.user.email,
					name: session.user.name,
				});
			} else if (client.get_property('$user_id')) {
				client.reset();
			}
		}
	} catch {
		// A failed session lookup does not prove logout and must not split the visitor's identity.
	}
	client.capture('$pageview');

	const artwork = location.pathname.match(/^\/artworks\/([^/]+)\/?$/);
	const checkout = new URLSearchParams(location.search).get('checkout');
	if (artwork && (checkout === 'success' || checkout === 'cancelled')) {
		// A browser return is not proof of payment; Stripe's webhook owns fulfillment.
		capture('checkout_returned', { artwork_slug: decodeURIComponent(artwork[1]), checkout_status: checkout });
	}
}
