export interface CarouselTiming {
	animated: boolean;
	cycleSeconds: number;
	fadeInPercent: number;
	visibleUntilPercent: number;
	fadeOutPercent: number;
	delays: number[];
}

export function getCarouselTiming(
	slideCount: number,
	slideSeconds = 8,
	fadeSeconds = 1.6,
): CarouselTiming {
	if (slideCount <= 1) {
		return {
			animated: false,
			cycleSeconds: 0,
			fadeInPercent: 0,
			visibleUntilPercent: 100,
			fadeOutPercent: 100,
			delays: slideCount === 1 ? [0] : [],
		};
	}

	const cycleSeconds = slideCount * slideSeconds;
	const fadePercent = (fadeSeconds / cycleSeconds) * 100;
	const visibleUntilPercent = 100 / slideCount;
	return {
		animated: true,
		cycleSeconds,
		fadeInPercent: fadePercent,
		visibleUntilPercent,
		fadeOutPercent: visibleUntilPercent + fadePercent,
		delays: Array.from(
			{ length: slideCount },
			(_, index) => index * slideSeconds - fadeSeconds,
		),
	};
}
