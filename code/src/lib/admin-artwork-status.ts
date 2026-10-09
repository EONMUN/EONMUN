type SaleFacts = { soldAt: Date | null; priceCents: number | null; quantity: number | null };
export const artworkSaleLabels = { available: 'Available', sold: 'Sold', 'not-for-sale': 'Not for sale' };
export function artworkSaleStatus(artwork: SaleFacts): keyof typeof artworkSaleLabels {
	if (artwork.soldAt) return 'sold';
	return artwork.priceCents !== null && artwork.priceCents > 0 && (artwork.quantity ?? 0) > 0 ? 'available' : 'not-for-sale';
}
