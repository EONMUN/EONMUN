import { getAllowedAdminEmails } from './auth';

export interface AnalyticsConfig { ADMIN_EMAILS?: string; POSTHOG_PROJECT_ID?: string; POSTHOG_PERSONAL_API_KEY?: string }
export interface TrafficReport {
	days: number;
	start: string;
	end: string;
	total: number;
	average: number;
	changePercent: number | null;
	daily: { date: string; views: number; average: number }[];
	sources: { label: string; views: number }[];
	countries: { label: string; views: number }[];
}
const DAY = 86_400_000;
const date = (value: number) => new Date(value).toISOString().slice(0, 10);

export function analyticsConfigured(env: AnalyticsConfig) {
	return typeof env.POSTHOG_PROJECT_ID === 'string' && /^\d+$/.test(env.POSTHOG_PROJECT_ID)
		&& typeof env.POSTHOG_PERSONAL_API_KEY === 'string' && env.POSTHOG_PERSONAL_API_KEY.trim().length > 0;
}

function rows(payload: unknown): [string, number][] {
	if (!payload || typeof payload !== 'object' || !('results' in payload) || !Array.isArray(payload.results)) {
		throw new Error('Invalid analytics response');
	}
	return payload.results.map((row: unknown) => {
		if (!Array.isArray(row) || typeof row[0] !== 'string' || !Number.isSafeInteger(row[1]) || row[1] < 0) {
			throw new Error('Invalid analytics row');
		}
		return [row[0], row[1]];
	});
}

export async function getTrafficReport(env: AnalyticsConfig, days: number, now = new Date(), fetcher: typeof fetch = fetch): Promise<TrafficReport> {
	if (![7, 30, 90].includes(days)) throw new Error('Invalid date range');
	if (!analyticsConfigured(env)) throw new Error('Analytics not configured');
	const emails = [...getAllowedAdminEmails({ ADMIN_EMAILS: env.ADMIN_EMAILS })];
	const values = Object.fromEntries(emails.map((email, index) => [`admin_email_${index}`, email]));
	// SECURITY: bind allowlisted addresses as values so email punctuation cannot alter SQL.
	const excludeAdmins = emails.length
		? `AND lower(coalesce(toString(person.properties.email), '')) NOT IN (${emails.map((_, index) => `{admin_email_${index}}`).join(', ')})`
		: '';
	const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	const start = end - days * DAY;
	const historyStart = end - (days * 2 + 6) * DAY;
	const filter = (from: number) => `event = '$pageview'
		AND timestamp >= toDateTime('${date(from)} 00:00:00', 'UTC')
		AND timestamp < toDateTime('${date(end)} 00:00:00', 'UTC')
		AND properties.$host IN ('eonmun.com', 'www.eonmun.com')
		AND properties.$pathname != '/admin' AND properties.$pathname NOT LIKE '/admin/%'
		AND properties.$pathname NOT LIKE '/api/%'
		${excludeAdmins}`;
	const query = async (name: string, sql: string) => {
		const response = await fetcher(`https://us.posthog.com/api/projects/${env.POSTHOG_PROJECT_ID}/query/`, {
			method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10_000),
			headers: { 'content-type': 'application/json', authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}` },
			body: JSON.stringify({ name: `EONMUN admin ${name}`, query: { kind: 'HogQLQuery', query: sql, values } }),
		});
		// SECURITY: never follow a redirect carrying the private PostHog credential.
		if (!response.ok) throw new Error(`Analytics upstream HTTP ${response.status}`);
		return rows(await response.json());
	};
	const [dailyRows, sourceRows, countryRows] = await Promise.all([
		query('daily pageviews', `SELECT toString(toDate(timestamp)), count() FROM events WHERE ${filter(historyStart)} GROUP BY 1 ORDER BY 1 LIMIT 186`),
		query('referring websites', `SELECT coalesce(nullIf(toString(properties.$referring_domain), ''), 'Direct / unknown'), count() FROM events WHERE ${filter(start)} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
		query('countries', `SELECT coalesce(nullIf(toString(properties.$geoip_country_name), ''), 'Unknown'), count() FROM events WHERE ${filter(start)} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
	]);
	const counts = new Map(dailyRows);
	const views = (day: number) => counts.get(date(day)) ?? 0;
	const daily = Array.from({ length: days }, (_, index) => {
		const day = start + index * DAY;
		return { date: date(day), views: views(day), average: Array.from({ length: 7 }, (_, n) => views(day - n * DAY)).reduce((a, b) => a + b, 0) / 7 };
	});
	const total = daily.reduce((sum, day) => sum + day.views, 0);
	const previous = Array.from({ length: days }, (_, n) => views(start - (n + 1) * DAY)).reduce((a, b) => a + b, 0);
	return {
		days, start: date(start), end: date(end - DAY), total, average: total / days,
		changePercent: previous ? (total - previous) / previous * 100 : null,
		daily, sources: sourceRows.map(([label, views]) => ({ label, views })),
		countries: countryRows.map(([label, views]) => ({ label, views })),
	};
}
