import { expect, test } from "bun:test";
import { renderPinterestFeed } from "./pinterest-feed";

test("renders a Pinterest catalog row with a stable ID, exact cents, and escaped text", () => {
	const feed = renderPinterestFeed([{
		id: 42,
		slug: "red-blue",
		title: 'Red, "Blue"',
		description: "Original <b>watercolor</b>\nartwork",
		imageUrl: "https://r2.eonmun.com/red-blue.jpg",
		priceCents: 12345,
	}], new URL("https://eonmun.com"));
	expect(feed).toBe('id,title,description,link,image_link,price,availability\r\n"artwork-42","Red, ""Blue""","Original watercolor artwork","https://eonmun.com/artworks/red-blue","https://r2.eonmun.com/red-blue.jpg","123.45 USD","in stock"\r\n');
});
