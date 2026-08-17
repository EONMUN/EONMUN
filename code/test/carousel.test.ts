import { describe, expect, test } from "bun:test";

import { getCarouselTiming } from "../src/lib/carousel";

describe("homepage carousel timing", () => {
	test("renders zero slides without animation", () => {
		expect(getCarouselTiming(0)).toEqual({
			animated: false,
			cycleSeconds: 0,
			fadeInPercent: 0,
			visibleUntilPercent: 100,
			fadeOutPercent: 100,
			delays: [],
		});
	});

	test("keeps one slide statically visible", () => {
		const timing = getCarouselTiming(1);
		expect(timing.animated).toBe(false);
		expect(timing.delays).toEqual([0]);
	});

	test("overlaps every transition for dynamic slide counts", () => {
		for (const count of [2, 3, 4, 7]) {
			const timing = getCarouselTiming(count);
			expect(timing.animated).toBe(true);
			expect(timing.cycleSeconds).toBe(count * 8);
			expect(timing.delays).toHaveLength(count);
			expect(timing.fadeInPercent).toBeGreaterThan(0);
			expect(timing.fadeOutPercent).toBeGreaterThan(timing.visibleUntilPercent);
			expect(timing.delays[0]).toBe(-1.6);
		}
	});
});
